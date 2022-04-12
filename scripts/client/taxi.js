const driverPedModels = [
  'a_m_m_fatlatin_01',
  'a_m_m_socenlat_01',
  'a_m_m_stlat_02',
  'a_m_y_latino_01',
  'a_m_y_stlat_01'
]

const vehicleHash = 'TAXI'; // https://wiki.gtanet.work/index.php?title=Vehicle_Models
const drivingStyle = 787245; // https://vespura.com/fivem/drivingstyle/
const maximumSpeed = 22; // meters per second

RegisterCommand('taxi', async () => {
  let estimatedArrivalInMinutes = 0;
  let lastEstimatedDistance = 0;
  let distanceTravelled = 0;

  let fareCost = 0;

  const player = PlayerPedId();
  if (!player) {
    errorMsg('Player not found');
    return;
  } // player not found

  const [x, y, z] = GetEntityCoords(player, true);

  const waypointBlip = GetFirstBlipInfoId(8);
  if (!waypointBlip) {
    errorMsg('No waypoint found');
    return;
  } // no waypoint found

  const [waypointX, waypointY] = GetBlipInfoIdCoord(waypointBlip);
  const waypointZ = GetHeightmapBottomZForPosition(waypointX, waypointY);

  const destinationLocationName = getLocationFromCoords(waypointX, waypointY, waypointZ);

  const [vehicle, driver] = await generateVehicle(vehicleHash, [x, y, z], GetEntityHeading(player), driverPedModels[Math.floor(Math.random() * driverPedModels.length)]);

  const playerSeat = GetVehicleModelNumberOfSeats(vehicleHash) - 2; // Get the last available seat, minus the driver seat.

  SetPedIntoVehicle(player, vehicle, playerSeat);
  SendNuiMessage(JSON.stringify({
    type: 'open',
    ui: 'taxiMeter'
  }));
  TaskVehicleDriveToCoordLongrange(driver, vehicle, waypointX, waypointY, waypointZ, maximumSpeed, drivingStyle, 0);

  SetEntityInvincible(vehicle, true);
  SetVehicleCanBreak(vehicle, false);
  SetVehicleTyresCanBurst(vehicle, false);
  SetVehicleNumberPlateText(vehicle, 'Floc Gay');

  while (!hasVehicleArrivedAtDestination(vehicle, [waypointX, waypointY, waypointZ]) && IsPedSittingInVehicle(player, vehicle) && IsPedSittingInVehicle(driver, vehicle)) {

    const [year, month, day, hour, minute, second] = GetUtcTime();

    const time = `${hour}:${minute}:${ second < 10 ? '0' + second : second }`;

    SetVehicleNumberPlateText(vehicle, time);

    const vehicleSpeed = Math.max(maximumSpeed * 0.5, GetEntitySpeed(vehicle)); // meters per second
    const [vehicleX, vehicleY, vehicleZ] = GetEntityCoords(vehicle, true);
    const distanceRemaining = CalculateTravelDistanceBetweenPoints(waypointX, waypointY, waypointZ, vehicleX, vehicleY, vehicleZ); // meters

    const timeRemainingInSeconds = (distanceRemaining / vehicleSpeed);
    estimatedArrivalInMinutes = timeRemainingInSeconds / 60;

    if (lastEstimatedDistance && lastEstimatedDistance !== distanceRemaining) {
      const distanceTraversed = lastEstimatedDistance - distanceRemaining;
      const toPositive = distanceTraversed < 0 ? distanceTraversed * -1 : distanceTraversed
      if (toPositive > 0 && toPositive < 100) {
        distanceTravelled += toPositive;
      }
    }

    lastEstimatedDistance = distanceRemaining;

    fareCost = (distanceTravelled * 0.02);

    SendNuiMessage(JSON.stringify({
      type: 'update',
      ui: 'taxiMeter',
      data: {
        destinationLocationName,
        timeRemainingInSeconds,
        estimatedArrivalInMinutes,
        distanceTravelled,
        fareCost
      }
    }));

    await Delay(500);
  }

  SendNuiMessage(JSON.stringify({
      type: 'parking',
      ui: 'taxiMeter',
      data: {
        destinationLocationName,
        fareCost: Math.ceil(fareCost)
      }
    }));

  setTimeout(() => {
    SendNuiMessage(JSON.stringify({
      type: 'close',
      ui: 'taxiMeter'
    }));
  }, 7500);

  if (!IsPedSittingInVehicle(player, vehicle)) {
    SendNuiMessage(JSON.stringify({
      type: 'end',
      ui: 'taxiMeter',
      data: {
        destinationLocationName,
        fareCost: Math.ceil(fareCost)
      }
    }));
    infoMsg('Journey ended early - you left the vehicle');
    SetVehicleAsNoLongerNeeded(vehicle);
    SetPedAsNoLongerNeeded(driver);
    return;
  }

  successMsg(`You have arrived at ${destinationLocationName}.`);

  console.log('parking vehicle');
  const vehicleHeading = GetEntityHeading(vehicle);
  TaskVehiclePark(driver, vehicle, waypointX, waypointY, waypointZ, vehicleHeading, 0, 20, true);

  while (!IsVehicleStopped(vehicle)) {
    await Delay(50);
  }

  console.log('Player leaving vehicle');
  TaskLeaveVehicle(player, vehicle, 0);

  while (!IsPedSittingInVehicle(player, vehicle)) {
    await Delay(50);
  }

  SendNuiMessage(JSON.stringify({
      type: 'end',
      ui: 'taxiMeter',
      data: {
        destinationLocationName,
        fareCost: Math.ceil(fareCost)
      }
    }));

  console.log('Setting Vehicle and Driver as no longer needed');
  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
}, false)