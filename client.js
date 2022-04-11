Delay = (ms) => new Promise(res => setTimeout(res, ms));
errorMsg = (msg) => emit('chat:addMessage', {
  args: [
    'Error',
    msg
  ],
  color: [255, 0, 0]
});
infoMsg = (msg) => emit('chat:addMessage', {
  args: [
    'Info',
    msg
  ],
  color: [0, 255, 255]
});
successMsg = (msg) => emit('chat:addMessage', {
  args: [
    'Success',
    msg
  ],
  color: [0, 255, 0]
});


RegisterCommand('kill', async (source) => {
  const player = PlayerPedId();

  if (!HasPedGotWeapon(player, GetHashKey('WEAPON_PISTOL'), false)) GiveWeaponToPed(player, GetHashKey('WEAPON_PISTOL'), 1, false, false);

  SetCurrentPedWeapon(player, GetHashKey('WEAPON_PISTOL'), true);

  RequestAnimDict('mp_suicide');
  while (!HasAnimDictLoaded('mp_suicide')) await Delay(500)

  TaskPlayAnim(player, "mp_suicide", "pistol", 8.0, 1.0, -1, 2, 0, 0, 0, 0 )
  await Delay(750)
  SetPedShootsAtCoord(player, 0.0, 0.0, 0.0, 0)
  SetEntityHealth(player, 0)
})

const driverPedModels = [
  'a_m_m_fatlatin_01',
  'a_m_m_socenlat_01',
  'a_m_m_stlat_02',
  'a_m_y_latino_01',
  'a_m_y_stlat_01'
]

const positionVariation = 30;
const vehicleHash = 'TAXI';
const drivingStyle = 787245;
const maxSpeed = 22;

AddRelationshipGroup('WSKY_TAXI_DRIVER');
SetRelationshipBetweenGroups(0, GetHashKey('WSKY_TAXI_DRIVER'), GetHashKey('PLAYER'));
SetRelationshipBetweenGroups(0, GetHashKey('PLAYER'), GetHashKey('WSKY_TAXI_DRIVER'));

async function generateTaxiandDriver(position, vehicleOverride, pedModelOverride) {
  const { x, y, z } = position;
  if (!x || !y || !z) throw new Error('Invalid position');

  const vehicleHashToGenerate = vehicleOverride || vehicleHash;
  const driverModel = pedModelOverride || driverPedModels[Math.floor(Math.random() * driverPedModels.length)];

  RequestModel(vehicleHashToGenerate);
  RequestModel(driverModel);

  while (!HasModelLoaded(vehicleHashToGenerate) || !HasModelLoaded(driverModel)) await Delay(500);

  const vehicle = CreateVehicle(GetHashKey(vehicleHashToGenerate), x, y, z, position.heading || 0.0, true, true);
  const driver = CreatePedInsideVehicle(vehicle, 4, driverModel, -1, true, true);

  SetPedRelationshipGroupHash(driver, GetHashKey('WSKY_TAXI_DRIVER'));

  TaskSetBlockingOfNonTemporaryEvents(driver, true); // prevent driver from being spooked and fleeing

  return { vehicle, driver };
}

// Take in two Vector3 objects and return the distance between them
function getDistance(location1, location2) {
  const x = location1.x - location2.x;
  const y = location1.y - location2.y;
  const z = location1.z - location2.z;
  return Math.sqrt(x * x + y * y + z * z);
}

function hasVehicleArrivedAtDestination(vehicle, destination) {
  const [ vehicleX, vehicleY, vehicleZ ] = GetEntityCoords(vehicle);
  const [ destinationX, destinationY, destinationZ ] = destination;
  const distance = getDistance({ x: vehicleX, y: vehicleY, z: vehicleZ }, { x: destinationX, y: destinationY, z: destinationZ });
  return distance <= positionVariation;
}

function getLocationFromCoords(x, y, z) {
  const zoneId = GetNameOfZone(x, y, z);
  const zoneName = zoneId ? GetLabelText(zoneId) : null;

  const [ streetNameHash ] = GetStreetNameAtCoord(x, y, z);
  const streetName = GetStreetNameFromHashKey(streetNameHash);

  let location = 'your destination';

  if (streetName) location = streetName;
  if (streetName && zoneName) location = `${streetName}, ${zoneName}`;
  else if (zoneName) location = zoneName;

  return location;
}

RegisterCommand('taxi', async () => {
  let estimatedArrivalInMinutes = 0;
  const player = PlayerPedId();
  if (!player) {
    errorMsg('Player not found');
    return;
  } // player not found

  const [ x, y, z ] = GetEntityCoords(player);

  const waypointBlip = GetFirstBlipInfoId(8);
  if (!waypointBlip) {
    errorMsg('No waypoint found');
    return;
  } // no waypoint found

  const waypointCoords = GetBlipInfoIdCoord(waypointBlip);
  const [ waypointX, waypointY ] = waypointCoords;
  const waypointZ = GetHeightmapBottomZForPosition(waypointX, waypointY);

  const { vehicle, driver } = await generateTaxiandDriver({ x, y, z, heading: GetEntityHeading(player) });

  const maxNumberOfSeats = GetVehicleModelNumberOfSeats(vehicleHash);
  const playerSeat = maxNumberOfSeats - 2;

  SetPedIntoVehicle(player, vehicle, playerSeat);
  TaskVehicleDriveToCoordLongrange(driver, vehicle, waypointX, waypointY, waypointZ, maxSpeed, drivingStyle, 0);

  setTimeout(() => {
    SetRadioToStationName('OFF'); // turn off radio, no way to control right now so better to just turn it off
  }, 5000);

  while (!hasVehicleArrivedAtDestination(vehicle, [ waypointX, waypointY, waypointZ ]) && IsPedSittingInVehicle(player, vehicle)) {

    const vehicleSpeed = Math.max(maxSpeed * 0.5, GetEntitySpeed(vehicle)); // meters per second
    const [ vehicleX, vehicleY, vehicleZ ] = GetEntityCoords(vehicle);
    const distanceRemaining = CalculateTravelDistanceBetweenPoints(waypointX, waypointY, waypointZ, vehicleX, vehicleY, vehicleZ); // meters

    const timeRemainingInSeconds = (distanceRemaining / vehicleSpeed);
    estimatedArrivalInMinutes = timeRemainingInSeconds / 60;

    console.log({
      vehicleSpeed,
      distanceRemaining,
      timeRemainingInSeconds,
      estimatedArrivalInMinutes
    });

    await Delay(500);
  }

  if (!IsPedSittingInVehicle(player, vehicle)) {
    infoMsg('Journey ended early - you left the vehicle');
    SetVehicleAsNoLongerNeeded(vehicle);
    SetPedAsNoLongerNeeded(driver);
    return;
  }

  const location = getLocationFromCoords(waypointX, waypointY, waypointZ);

  successMsg(`You have arrived at ${location}.`);

  const vehicleHeading = GetEntityHeading(vehicle);

  console.log('parking vehicle');

  TaskVehiclePark(driver, vehicle, waypointX, waypointY, waypointZ, vehicleHeading, 0, 20, true);
  
  while (!IsVehicleStopped(vehicle)) await Delay(50);

  console.log('Player leaving vehicle');

  TaskLeaveVehicle(player, vehicle, 0);

  while (!IsPedSittingInVehicle(player, vehicle)) await Delay(500);

  console.log('Setting Vehicle and Driver as no longer needed');

  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
})

RegisterCommand('follow', async (source, args) => {
  const chaseDrivingStyle = {
    nearby: 17564460,
    default: 787244
  }
  const player = PlayerPedId();
  if (!player) {
    errorMsg('Player not found');
    return;
  } // player not found

  const [ x, y, z ] = GetEntityCoords(player);

  const mode = args[1] || 'normal';

  let vehicleOverride = 'DOMINATOR';
  let pedOverride = 'player_one';

  switch (mode) {
    case 'cop':
      pedOverride = 'player_one';
      vehicleOverride = 'POLICE'; // Can't use cop model, they fight back.
      break;
    case 'bike':
      pedOverride = 'player_one';
      vehicleOverride = 'BAGGER';
      break;
    case 'tank':
      pedOverride = 'player_one';
      vehicleOverride = 'KHANJALI';
      break;
    case 'deluxo':
      pedOverride = 'player_one';
      vehicleOverride = 'DELUXO';
      break;
    case 'super':
      pedOverride = 'player_one';
      vehicleOverride = 'TAIPAN';
      break;
    case 'ram':
      pedOverride = 'player_one';
      vehicleOverride = 'PHANTOM2';
      break;
    case 'gay':
      pedOverride = 'player_one';
      vehicleOverride = 'TORNADO';
      break;
    case 'cunt':
      pedOverride = 'player_one';
      vehicleOverride = 'DUNE5';
      break;
    case 'monster':
      pedOverride = 'player_one';
      vehicleOverride = 'MARSHALL';
      break;
  }

  console.log(args, mode, pedOverride, vehicleOverride);

  const targetPlayerName = args[0];
  const allPlayers = GetActivePlayers();

  const targetPlayer = allPlayers.find(player => {
    const playerName = GetPlayerName(player);
    return playerName.toLowerCase().includes(targetPlayerName.toLowerCase());
  });
  const targetPed = GetPlayerPed(targetPlayer);

  if (!targetPlayer) {
    errorMsg('Target player not found');
    return;
  } // player not found

  const { vehicle, driver } = await generateTaxiandDriver({ x, y, z, heading: GetEntityHeading(player) }, vehicleOverride, pedOverride);

  SetVehicleNumberPlateText(vehicle, 'GAY');
  SetVehicleTyresCanBurst(vehicle, false);

  ModifyVehicleTopSpeed(vehicle, 600);

  SetPedIntoVehicle(player, vehicle, 0);
  SetVehicleEngineOn(vehicle, true, true, false);

  SetVehicleSiren(vehicle, true);

  setTimeout(() => {
    SetRadioToStationName('OFF'); // turn off radio, no way to control right now so better to just turn it off
  }, 5000);

  // Follow Mode: If the target player is too far away, we'll use waypoint and refresh it every so often.
  // Otherwise, we'll use standard follow and only set the Task once.
  let taxiTravelMode = null; // follow, waypoint

  let memory = {
    lastDrivingStyle: null,
    lastTravelModel: null,
    lastTargetLocation: null
  }

  let counter = 0;

  while (IsPedSittingInVehicle(player, vehicle) && GetPlayerFromServerId(targetPlayer)) {
    counter += 1;
    SetVehicleCheatPowerIncrease(vehicle, 1024);
    [ targetX, targetY, targetZ ] = GetEntityCoords(targetPed);

    const [ vehicleX, vehicleY, vehicleZ ] = GetEntityCoords(vehicle);
    const distance = CalculateTravelDistanceBetweenPoints(targetX, targetY, targetZ, vehicleX, vehicleY, vehicleZ);

    const targetVehicle = GetVehiclePedIsIn(targetPed, false);

    let distanceStyle = 'default';
    if (distance < 1000 && HasEntityClearLosToEntity(driver, targetVehicle || targetPed, 17)) distanceStyle = 'nearby';

    const changeInMemory = memory.lastDrivingStyle !== distanceStyle;

    const style = chaseDrivingStyle[distanceStyle];

    console.log(distance, distanceStyle);

    // console.log(distance, taxiTravelMode, distanceStyle, changeInMemory, memory);

    if ((distance < 100000 && taxiTravelMode !== 'follow') || (changeInMemory && taxiTravelMode === 'follow')) {
      taxiTravelMode = 'follow';
      TaskVehicleFollow(driver, vehicle, targetPed, 600, style, 0);
      memory.lastDrivingStyle = distanceStyle;
      memory.lastTravelModel = 'follow';
      memory.lastTargetLocation = [ targetX, targetY, targetZ ];
    } else if ((distance >= 100000) || (changeInMemory && taxiTravelMode === 'waypoint')) {
      taxiTravelMode = 'waypoint';
      TaskVehicleDriveToCoordLongrange(driver, vehicle, targetX, targetY, targetZ, 600, style, 0);
      memory.lastDrivingStyle = distanceStyle;
      memory.lastTravelModel = 'waypoint';
      memory.lastTargetLocation = [ targetX, targetY, targetZ ];
    }

    if (counter >= 10) {
      counter = 0;
      // Generate random RGB values
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);

      // Set the RGB values of the taxi
      SetVehicleCustomPrimaryColour(vehicle, r, g, b);
      SetVehicleCustomSecondaryColour(vehicle, r, g, b);
    }

    await Delay(0);
  }

  TaskLeaveVehicle(player, vehicle, 0);

  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
})