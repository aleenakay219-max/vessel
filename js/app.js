// Mode toggle
function setMode(mode) {
    if (window.state.currentN && window.state.currentN.id) {
        window.setStatus('error', 'Cannot switch mode while in an active connection. Terminate first.');
        return;
    }
    window.state.currentMode = mode;
    document.getElementById('mode-browse').classList.toggle('active', mode === 'browse');
    document.getElementById('mode-create').classList.toggle('active', mode === 'create');
    document.getElementById('fab').style.display = mode === 'create' ? 'flex' : 'none';
    document.getElementById('profile-gear').style.display = mode === 'create' ? 'flex' : 'none';
    if (mode === 'browse') scan();
    window.closeIntentPanel();
    window.closeProfileCard();
}
document.getElementById('mode-browse').addEventListener('click', () => setMode('browse'));
document.getElementById('mode-create').addEventListener('click', () => setMode('create'));
setMode('browse');

// GPS watcher
navigator.geolocation.watchPosition(p => {
    window.state.myLoc = { lat: p.coords.latitude, lng: p.coords.longitude };
    window.state.gpsReady = true;
    window.state.gpsFailures = 0;
    window.clearStatus();
}, e => {
    window.state.gpsFailures++;
    window.state.gpsReady = false;
    if (window.state.gpsFailures === 1) window.setStatus('warning', 'GPS signal weak');
    if (window.state.gpsFailures > 5) window.setStatus('error', 'GPS unavailable');
}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
window.setStatus('info', 'Waiting for GPS...');

// Terminate button
document.getElementById('terminate-btn').addEventListener('click', () => {
    if (window.state.currentN && window.state.currentN.id) window.showReceipt(window.state.currentN.id);
    else location.reload();
});
