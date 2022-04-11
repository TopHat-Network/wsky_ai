const driverPedModels = [
  'a_m_m_fatlatin_01',
  'a_m_m_socenlat_01',
  'a_m_m_stlat_02',
  'a_m_y_latino_01',
  'a_m_y_stlat_01'
]

const vehicleHash = 'TAXI';
const drivingStyle = 787245;
const maxSpeed = 22;

RegisterCommand('taxi', async () => {
  let estimatedArrivalInMinutes = 0;

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

  const [vehicle, driver] = await generateVehicle('TAXI', [x, y, z], 0, 'a_m_m_fatlatin_01');

  const playerSeat = GetVehicleModelNumberOfSeats(vehicleHash) - 2; // Get the last available seat, minus the driver seat.

  SetPedIntoVehicle(player, vehicle, playerSeat);
  TaskVehicleDriveToCoordLongrange(driver, vehicle, waypointX, waypointY, waypointZ, maximumSpeed, drivingStyle, 0);

  while (!hasVehicleArrivedAtDestination(vehicle, [waypointX, waypointY, waypointZ]) && IsPedSittingInVehicle(player, vehicle) && IsPedSittingInVehicle(driver, vehicle)) {

    const vehicleSpeed = Math.max(maximumSpeed * 0.5, GetEntitySpeed(vehicle)); // meters per second
    const [vehicleX, vehicleY, vehicleZ] = GetEntityCoords(vehicle, true);
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

  console.log('Setting Vehicle and Driver as no longer needed');
  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
}, false)