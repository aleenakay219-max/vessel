const supabaseClient = supabase.createClient(
    "https://rnroyhkvkmzuichysxnk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucm95aGt2a216dWljaHlzeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MjIzMDAsImV4cCI6MjA5MjQ5ODMwMH0.O1poxwOr2kESKiqRTgkb86AFFwIN8wEMuW10UEsp_DU"
);
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFkYXJraGFuMTE1IiwiYSI6ImNtb2dybG02cDB6bXAyd3M2dDZoeGR3ZzAifQ.-Bepjo9kyGavV3lO3LOWug';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MAX_VENUE_DISTANCE_KM = 20;
const NODE_EXPIRY_MINUTES = 30;
const HEATMAP_RADIUS_KM = 50;
const HEATMAP_CELL_SIZE_DEG = 0.02;
const MIN_NODES_FOR_HEATMAP = 3;
const params = new URLSearchParams(window.location.search);
const MEET_DURATION_MINUTES = params.get('debug') ? parseInt(params.get('debug')) : 2;
