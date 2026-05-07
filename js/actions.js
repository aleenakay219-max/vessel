// Node creation
window.startCreation = () => {
    const finalIntent = window.state.selectedIntentText === 'Custom' ? window.state.customIntentText : window.state.selectedIntentText;
    if (!finalIntent.trim()) { window.setStatus('error', 'Please select or enter an intent'); return; }
    if (window.state.selectedCategory === 'social' && window.state.selectedNodeType === 'one_on_one' && 
        window.vibeChecks[window.state.selectedIntentText] && !window.state.selectedVibeAnswer) {
        window.setStatus('error', 'Please select a vibe before dropping');
        return;
    }
    window.setStatus('info', 'Drop your node on the map');
    window.map.once('click', async (e) => {
        window.setStatus('info', 'Creating node...');
        const nodeData = {
            lat: e.lngLat.lat, lng: e.lngLat.lng,
            intent: finalIntent,
            category: window.state.selectedCategory,
            node_type: window.state.selectedNodeType,
            max_participants: window.state.selectedNodeType === 'group' ? window.state.selectedMaxParticipants : null,
            status: 'active',
            user_id: window.state.myUserId,
            expires_at: new Date(Date.now() + window.NODE_EXPIRY_MINUTES * 60 * 1000).toISOString()
        };
        if (window.state.selectedCategory === 'social' && window.state.selectedNodeType === 'one_on_one' &&
            window.state.selectedVibeAnswer && window.vibeChecks[window.state.selectedIntentText]) {
            nodeData.vibe_question = window.vibeChecks[window.state.selectedIntentText].q;
            nodeData.vibe_answer = window.state.selectedVibeAnswer;
        }
        const { data, error } = await window.supabaseClient.from('nodes').insert([nodeData]).select();
        if (error) { window.setStatus('error', 'Failed to create node: ' + error.message); return; }
        window.state.currentN = data[0];
        window.clearStatus();
        window.setStatus('success', '"' + finalIntent + '" node active! ' + window.NODE_EXPIRY_MINUTES + ' mins.');
        new mapboxgl.Marker({ color: '#FFD700' }).setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(window.map);
        try { await window.supabaseClient.from('logs').insert([{event_type:'node_created', user_id:window.state.myUserId, details:{node_id:window.state.currentN.id, intent:finalIntent}}]); } catch(e) {}
        window.supabaseClient.channel('reqs-' + window.state.currentN.id)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests', filter: 'node_id=eq.' + window.state.currentN.id }, () => {
                window.clearStatus();
                window.setStatus('success', 'Someone wants to connect!');
                document.getElementById('terminal').style.display = 'flex';
                window.loadInbox();
            }).subscribe();
    });
};

// Send message
window.sendMsg = async () => {
    const val = document.getElementById('chat-in').value; if (!val.trim()) return;
    const sender = window.state.currentMode === 'create' ? 'CREATOR' : 'SEEKER';
    await window.supabaseClient.from('messages').insert([{node_id: window.state.currentN.id, sender: sender, content: val}]);
    document.getElementById('chat-in').value = '';
};

// Oracle
window.initiateOracle = async () => {
    if (!window.state.gpsReady || window.state.myLoc.lat === 0) { window.setStatus('error', 'GPS not ready'); return; }
    window.setStatus('info', 'Syncing GPS...');
    if (window.state.currentMode === 'create') {
        await window.supabaseClient.from('oracle_sessions').upsert({ bridge_id: window.state.currentN.id, u1_lat: window.state.myLoc.lat, u1_lng: window.state.myLoc.lng }, { onConflict: 'bridge_id' });
    } else {
        await window.supabaseClient.from('oracle_sessions').upsert({ bridge_id: window.state.currentN.id, u2_lat: window.state.myLoc.lat, u2_lng: window.state.myLoc.lng }, { onConflict: 'bridge_id' });
    }
};

// Confirm proceed
window.confirmProceed = async () => {
    window.state.myConfirmed = true;
    document.getElementById('sync-confirm-btn').style.display = 'none';
    document.getElementById('sync-status').innerText = 'Waiting for other user...';
    if (window.state.currentMode === 'create') {
        await window.supabaseClient.from('oracle_sessions').update({ u1_confirmed: true }).eq('bridge_id', window.state.currentN.id);
    } else {
        await window.supabaseClient.from('oracle_sessions').update({ u2_confirmed: true }).eq('bridge_id', window.state.currentN.id);
    }
};

// Rating
window.submitRating = async (r) => {
    if (window.state.meetRated) return;
    window.state.meetRated = true;
    document.getElementById('rate-panel').style.display = 'none';
    if (window.state.currentMode === 'create') {
        await window.supabaseClient.from('oracle_sessions').update({ u1_rating: r }).eq('bridge_id', window.state.currentN.id);
    } else {
        await window.supabaseClient.from('oracle_sessions').update({ u2_rating: r }).eq('bridge_id', window.state.currentN.id);
    }
    window.setStatus('success', 'Thanks for rating!');
    window.showReceipt(window.state.currentN.id);
};

// Additional actions (handleRequest, sendRequest, etc.) are in ui.js because they update UI.
