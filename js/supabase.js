window.supabaseClient = supabase.createClient(
    "https://rnroyhkvkmzuichysxnk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucm95aGt2a216dWljaHlzeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjIzMDAsImV4cCI6MjA5MjQ5ODMwMH0.O1poxwOr2kESKiqRTgkb86AFFwIN8wEMuW10UEsp_DU"
);
window.MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFkYXJraGFuMTE1IiwiYSI6ImNtb2dybG02cDB6bXAyd3M2dDZoeGR3ZzAifQ.-Bepjo9kyGavV3lO3LOWug';
mapboxgl.accessToken = window.MAPBOX_TOKEN;

window.MAX_VENUE_DISTANCE_KM = 20;
window.NODE_EXPIRY_MINUTES = 30;
window.HEATMAP_RADIUS_KM = 50;
window.HEATMAP_CELL_SIZE_DEG = 0.02;
window.MIN_NODES_FOR_HEATMAP = 3;
window.MEET_DURATION_MINUTES = new URLSearchParams(window.location.search).get('debug') ? parseInt(new URLSearchParams(window.location.search).get('debug')) : 2;
