function haversine(lat1,lng1,lat2,lng2) {
    const R=6371;
    const dLat=(lat2-lat1)*Math.PI/180;
    const dLng=(lng2-lng1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function bbox(midLat,midLng,r) {
    const dLat=r/111.32;
    const dLng=r/(111.32*Math.cos(midLat*Math.PI/180));
    return (midLng-dLng)+','+(midLat-dLat)+','+(midLng+dLng)+','+(midLat+dLat);
}
async function runOracleBrain(s) {
    const midLat=(s.u1_lat+s.u2_lat)/2, midLng=(s.u1_lng+s.u2_lng)/2;
    const queries=['cafe','coffee shop','restaurant','mall','park'];
    let bestVenue=null;
    for(const q of queries){
        for(const r of [3,6,10,15,window.MAX_VENUE_DISTANCE_KM]){
            if(bestVenue) break;
            const box=bbox(midLat,midLng,r);
            const url=`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(q)}&proximity=${midLng},${midLat}&bbox=${box}&limit=10&access_token=${window.MAPBOX_TOKEN}`;
            try{
                const res=await fetch(url);
                const d=await res.json();
                if(d.features && d.features.length>0){
                    const nearby=d.features.filter(f=>f.geometry.coordinates[1]&&f.geometry.coordinates[0]).map(f=>({
                        name: f.properties.name || f.properties.full_address || 'Venue',
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0],
                        dist: haversine(midLat,midLng,f.geometry.coordinates[1],f.geometry.coordinates[0])
                    })).filter(v=>v.dist<=window.MAX_VENUE_DISTANCE_KM).sort((a,b)=>a.dist-b.dist);
                    if(nearby.length>0) bestVenue=nearby[0];
                }
            }catch(e){}
        }
        if(bestVenue) break;
    }
    if(bestVenue){
        await window.supabaseClient.from('oracle_sessions').update({
            status:'matched',
            options_generated:true,
            error_state:null,
            selected_venue_name:bestVenue.name,
            selected_lat:bestVenue.lat,
            selected_lng:bestVenue.lng,
            meet_expires_at:new Date(Date.now()+window.MEET_DURATION_MINUTES*60*1000).toISOString()
        }).eq('bridge_id', window.state.currentN.id);
    } else {
        await window.supabaseClient.from('oracle_sessions').update({
            status:'matched',
            options_generated:true,
            error_state:null,
            selected_venue_name:'Midpoint Meeting Spot',
            selected_lat:midLat,
            selected_lng:midLng,
            meet_expires_at:new Date(Date.now()+window.MEET_DURATION_MINUTES*60*1000).toISOString()
        }).eq('bridge_id', window.state.currentN.id);
    }
}
