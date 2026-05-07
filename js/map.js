// Map instance
window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [55.39, 25.34],
    zoom: 12
});

// Helper functions for heatmap (will be used by ui.js)
async function getAreaName(lng, lat) {
    const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
    if (window.state.reverseGeocodeCache.has(key)) return window.state.reverseGeocodeCache.get(key);
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${window.MAPBOX_TOKEN}&types=place,neighborhood,locality`;
        const res = await fetch(url);
        const data = await res.json();
        let name = '';
        if (data.features && data.features.length) {
            const feat = data.features.find(f => f.place_type.includes('neighborhood')) ||
                         data.features.find(f => f.place_type.includes('locality')) ||
                         data.features[0];
            name = feat.text;
            if (feat.context) {
                const city = feat.context.find(c => c.id.includes('place'));
                if (city) name += `, ${city.text}`;
            }
        }
        if (!name) name = `${lat.toFixed(2)},${lng.toFixed(2)}`;
        window.state.reverseGeocodeCache.set(key, name);
        return name;
    } catch (e) {
        return `${lat.toFixed(2)},${lng.toFixed(2)}`;
    }
}

async function fetchNodesWithinRadius(centerLat, centerLng, radiusKm) {
    const delta = radiusKm / 111;
    const latMin = centerLat - delta;
    const latMax = centerLat + delta;
    const lngMin = centerLng - delta / Math.cos(centerLat * Math.PI / 180);
    const lngMax = centerLng + delta / Math.cos(centerLat * Math.PI / 180);
    const { data, error } = await window.supabaseClient
        .from('nodes')
        .select('id, lat, lng')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .gte('lat', latMin)
        .lte('lat', latMax)
        .gte('lng', lngMin)
        .lte('lng', lngMax);
    if (error) throw error;
    return (data || []).filter(node => haversine(centerLat, centerLng, node.lat, node.lng) <= radiusKm);
}

function groupNodesByGrid(nodes, cellSizeDeg = 0.02) {
    const grid = new Map();
    nodes.forEach(node => {
        const cellLat = Math.floor(node.lat / cellSizeDeg) * cellSizeDeg;
        const cellLng = Math.floor(node.lng / cellSizeDeg) * cellSizeDeg;
        const key = `${cellLat},${cellLng}`;
        if (!grid.has(key)) grid.set(key, { lat: cellLat + cellSizeDeg/2, lng: cellLng + cellSizeDeg/2, count: 0 });
        grid.get(key).count++;
    });
    return Array.from(grid.values()).sort((a,b) => b.count - a.count);
}

// Node scanning (clustering)
async function scan() {
    const now = new Date().toISOString();
    const bounds = window.map.getBounds();
    if (!bounds) return;
    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    const latMin = sw.lat - 0.02, latMax = ne.lat + 0.02;
    const lngMin = sw.lng - 0.02, lngMax = ne.lng + 0.02;
    const { data, error } = await window.supabaseClient
        .from('nodes')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', now)
        .gte('lat', latMin)
        .lte('lat', latMax)
        .gte('lng', lngMin)
        .lte('lng', lngMax)
        .limit(200);
    if (error) { window.setStatus('error','Connection issue'); return; }
    const features = (data || []).map(node => ({
        type: 'Feature',
        geometry: { type:'Point', coordinates: [parseFloat(node.lng), parseFloat(node.lat)] },
        properties: {
            id: node.id, intent: node.intent || 'Coffee',
            category: node.category || 'social',
            node_type: node.node_type || 'one_on_one',
            vibe_question: node.vibe_question,
            vibe_answer: node.vibe_answer,
            user_id: node.user_id,
            color: '#FFD700',
            emoji: '📍',
            expires_at: node.expires_at
        }
    }));
    const source = window.map.getSource('nodes-source');
    if (source) source.setData({ type:'FeatureCollection', features });
    if (features.length === 0) window.setStatus('info','No active nodes in this area. Scanning...');
    else document.getElementById('status-bar').style.display = 'none';
}

// Map load event
window.map.on('load', () => {
    window.map.addSource('nodes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true, clusterMaxZoom: 14, clusterRadius: 50
    });
    window.map.addLayer({
        id:'nodes-clusters', type:'circle', source:'nodes-source', filter:['has','point_count'],
        paint:{ 'circle-color':'#111','circle-stroke-color':'#FFD700','circle-stroke-width':2,
                'circle-radius':['step',['get','point_count'],20,10,25,30,35],'circle-opacity':0.9 }
    });
    window.map.addLayer({
        id:'nodes-cluster-count', type:'symbol', source:'nodes-source', filter:['has','point_count'],
        layout:{ 'text-field':'{point_count_abbreviated}','text-font':['DIN Offc Pro Medium','Arial Unicode MS Bold'],'text-size':14 },
        paint:{ 'text-color':'#FFD700' }
    });
    window.map.addLayer({
        id:'nodes-unclustered', type:'circle', source:'nodes-source', filter:['!',['has','point_count']],
        paint:{ 'circle-color':['get','color'],'circle-radius':8,'circle-opacity':0.9,'circle-stroke-color':'#fff','circle-stroke-width':1.5 }
    });
    window.map.addLayer({
        id:'nodes-emoji', type:'symbol', source:'nodes-source', filter:['!',['has','point_count']],
        layout:{ 'text-field':['get','emoji'], 'text-font':['Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Arial Unicode MS Bold'], 'text-size':16, 'text-allow-overlap':true },
        paint:{ 'text-color':'#fff', 'text-halo-color':'#000', 'text-halo-width':1 }
    });
    const popup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, className:'node-popup' });
    window.map.on('mouseenter', 'nodes-unclustered', (e) => {
        window.map.getCanvas().style.cursor = 'pointer';
        const props = e.features[0].properties;
        const timeLeft = Math.max(0, Math.floor((new Date(props.expires_at) - Date.now()) / 60000));
        popup.setLngLat(e.lngLat).setHTML(props.intent + ' [' + timeLeft + 'm]').addTo(window.map);
    });
    window.map.on('mouseleave', 'nodes-unclustered', () => {
        window.map.getCanvas().style.cursor = '';
        popup.remove();
    });
    window.map.on('click', 'nodes-unclustered', async (e) => {
        if (window.state.currentMode !== 'browse') return;
        if (window.state.currentN) return;
        const nodeProps = e.features[0].properties;
        window.openProfileCard(nodeProps);
    });
    window.map.on('click', 'nodes-clusters', (e) => {
        const features = window.map.queryRenderedFeatures(e.point, { layers:['nodes-clusters'] });
        const clusterId = features[0].properties.cluster_id;
        window.map.getSource('nodes-source').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (!err) window.map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
    });
    scan();
    window.map.on('moveend', scan);
});
