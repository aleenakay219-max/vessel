const map = new mapboxgl.Map({
    container:'map',
    style:'mapbox://styles/mapbox/dark-v11',
    center:[55.39,25.34],
    zoom:12
});

// Node clustering, scanning, etc. (copy from your anchor, but using `window.state` and `supabaseClient`)
// I'll summarise – you can copy the exact functions from your anchor:
// - map.on('load') adds sources and layers
// - scan() queries nodes and updates source
// - heatmap toggle (will be in ui.js)
