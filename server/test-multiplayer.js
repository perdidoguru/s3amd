import { io } from 'socket.io-client';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';

async function runTests() {
  console.log('--- Starting Cinema Social 3D Multiplayer Simulation Tests ---');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Connect Client 1 (Alice)
  const client1 = io(SERVER_URL, { transports: ['websocket'] });
  // 2. Connect Client 2 (Bob)
  const client2 = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => client1.on('connect', resolve));
  await new Promise((resolve) => client2.on('connect', resolve));

  assert(client1.connected && client2.connected, 'Both clients connected successfully via WebSocket');

  const testRoomCode = 'TEST' + Math.floor(100 + Math.random() * 900);

  // Alice joins room
  const aliceJoinedPromise = new Promise((resolve) => {
    client1.on('room:joined', resolve);
  });
  client1.emit('room:join', {
    code: testRoomCode,
    playerName: 'Alice',
    color: '#ec4899',
    createPrivate: true,
  });
  const aliceJoinData = await aliceJoinedPromise;

  assert(aliceJoinData.room.code === testRoomCode, `Alice created & joined room ${testRoomCode}`);
  assert(aliceJoinData.room.hostId === client1.id, 'Alice is assigned as room host');
  assert(Object.keys(aliceJoinData.room.chairs).length >= 24, 'Room has tiered seating layout with 24+ chairs');

  // Bob joins room
  const bobJoinedPromise = new Promise((resolve) => {
    client2.on('room:joined', resolve);
  });
  const aliceNotifiedBobJoinedPromise = new Promise((resolve) => {
    client1.on('player:joined', resolve);
  });

  client2.emit('room:join', {
    code: testRoomCode,
    playerName: 'Bob',
    color: '#06b6d4',
  });

  const bobJoinData = await bobJoinedPromise;
  const aliceNotifiedBob = await aliceNotifiedBobJoinedPromise;

  assert(bobJoinData.room.code === testRoomCode, `Bob successfully joined room ${testRoomCode}`);
  assert(aliceNotifiedBob.name === 'Bob', 'Alice received notification that Bob joined');

  // Test Movement Sync
  const bobReceivedMovePromise = new Promise((resolve) => {
    client2.on('players:update', (batch) => {
      if (batch[client1.id]) {
        resolve(batch[client1.id]);
      }
    });
  });

  client1.emit('player:move', {
    position: [2.5, 0, -1.0],
    rotationY: 1.57,
    animation: 'walk',
    isSpeaking: true,
  });

  const moveData = await bobReceivedMovePromise;
  assert(
    moveData.position[0] === 2.5 && moveData.animation === 'walk',
    'Bob received Alice movement update with position and walk animation'
  );

  // Test Chair Interaction: Alice sits on chair_r1_c1
  const bobNotifiedAliceSatPromise = new Promise((resolve) => {
    client2.on('chair:occupied', resolve);
  });

  client1.emit('chair:sit', { chairId: 'chair_r1_c1' });
  const chairOccupiedData = await bobNotifiedAliceSatPromise;

  assert(
    chairOccupiedData.chairId === 'chair_r1_c1' && chairOccupiedData.playerId === client1.id,
    'Chair chair_r1_c1 successfully occupied by Alice and synced to Bob'
  );

  // Test Chair Collision / Double Occupation Prevention: Bob tries to sit on same occupied chair
  const bobSitErrorPromise = new Promise((resolve) => {
    client2.on('room:error', resolve);
  });

  client2.emit('chair:sit', { chairId: 'chair_r1_c1' });
  const errorData = await bobSitErrorPromise;

  assert(
    errorData.message.includes('occupied') || errorData.message.includes('ocupada'),
    'Server successfully rejected Bob attempting to sit on an already occupied chair'
  );

  // Bob sits on free chair chair_r1_c2
  const aliceNotifiedBobSatPromise = new Promise((resolve) => {
    client1.on('chair:occupied', resolve);
  });

  client2.emit('chair:sit', { chairId: 'chair_r1_c2' });
  const bobSatData = await aliceNotifiedBobSatPromise;

  assert(bobSatData.chairId === 'chair_r1_c2', 'Bob sat on unoccupied chair chair_r1_c2');

  // Test Alice Standing Up
  const bobNotifiedAliceStoodPromise = new Promise((resolve) => {
    client2.on('chair:freed', resolve);
  });

  client1.emit('chair:stand');
  const chairFreedData = await bobNotifiedAliceStoodPromise;

  assert(chairFreedData.chairId === 'chair_r1_c1', 'Chair chair_r1_c1 freed when Alice stood up');

  // Test Media Control: Host updates YouTube video
  const bobNotifiedMediaUpdatePromise = new Promise((resolve) => {
    client2.on('media:updated', resolve);
  });

  client1.emit('media:update', {
    type: 'youtube',
    mediaId: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 4K',
    playing: true,
    currentTime: 42,
  });

  const mediaData = await bobNotifiedMediaUpdatePromise;
  assert(
    mediaData.mediaId === 'aqz-KE-bpKQ' && mediaData.currentTime === 42,
    'Host updated video on cinema screen and state synced across participants'
  );

  // Test Disconnection & Host Transfer: Alice disconnects
  const aliceSocketId = client1.id;
  const bobNotifiedAliceLeftPromise = new Promise((resolve) => {
    client2.on('player:left', resolve);
  });
  const bobNotifiedNewHostPromise = new Promise((resolve) => {
    client2.on('host:changed', resolve);
  });

  client1.disconnect();

  const leftData = await bobNotifiedAliceLeftPromise;
  const newHostData = await bobNotifiedNewHostPromise;

  assert(leftData.playerId === aliceSocketId, 'Bob notified Alice disconnected');
  assert(newHostData.hostId === client2.id, 'Host privileges automatically transferred to Bob');

  client2.disconnect();

  console.log(`\n===========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
