window.setStatus = function(t,m) { ... };
window.clearStatus = function() { ... };
window.openIntentPanel = function() { document.getElementById('intent-panel').style.display = 'block'; };
window.closeIntentPanel = function() { document.getElementById('intent-panel').style.display = 'none'; };
window.openProfilePanel = async function() { ... };
window.closeProfilePanel = function() { ... };
window.saveProfile = async function() { ... };
window.loadInbox = async function() { ... };
window.handleRequest = async function(requestId, newStatus) { ... };
window.openProfileCard = async function(nodeProps) { ... };
window.closeProfileCard = function() { ... };
window.sendRequest = async function(nodeProps, answer_given) { ... };
window.showReceipt = async function(bridgeId) { ... };
window.drawRoute = async function(id, sLng, sLat, eLng, eLat, color) { ... };

// Accordion builder (original)
function buildAccordion() { ... } // from your anchor
buildAccordion();

// Heatmap toggle
document.getElementById('heatmap-toggle-btn').addEventListener('click', async () => {
    window.state.heatmapOn = !window.state.heatmapOn;
    const btn = document.getElementById('heatmap-toggle-btn');
    btn.style.background = window.state.heatmapOn ? '#FFD700' : '#000';
    btn.style.color = window.state.heatmapOn ? '#000' : '#FFD700';
    if (!window.state.heatmapOn) {
        document.getElementById('heatmap-panel').style.display = 'none';
        return;
    }
    document.getElementById('heatmap-panel').style.display = 'flex';
    // updateHeatmapPanel logic from your anchor (using fetchNodesWithinRadius, groupNodesByGrid, etc.)
});
// At the end of ui.js
buildAccordion();
