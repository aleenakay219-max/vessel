window.state = {
    myUserId: localStorage.getItem('vessel_user_id'),
    currentMode: 'browse',
    currentN: null,
    myLoc: {lat: 0, lng: 0},
    gpsReady: false,
    gpsFailures: 0,
    meetRated: false,
    myConfirmed: false,
    meetTimerInterval: null,
    oracleProcessed: false,
    acceptancePoll: null,
    lastMsgId: 0,
    selectedVenueCoords: null,
    selectedCategory: 'social',
    selectedIntentText: '☕ Coffee & Conversation',
    customIntentText: '',
    selectedNodeType: 'one_on_one',
    selectedMaxParticipants: null,
    selectedVibeAnswer: null,
    pendingNodeProps: null,
    seekerVibeAnswer: null,
    heatmapOn: false,
    reverseGeocodeCache: new Map()
};

if (!window.state.myUserId) {
    window.state.myUserId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
    localStorage.setItem('vessel_user_id', window.state.myUserId);
}
