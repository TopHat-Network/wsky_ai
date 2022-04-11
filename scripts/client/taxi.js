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

  const [x, y, z] = GetEntityCoords(player);

  const waypointBlip = GetFirstBlipInfoId(8);
  if (!waypointBlip) {
    errorMsg('No waypoint found');
    return;
  } // no waypoint found

  const waypointCoords = GetBlipInfoIdCoord(waypointBlip);
  const [waypointX, waypointY] = waypointCoords;
  const waypointZ = GetHeightmapBottomZForPosition(waypointX, waypointY);

  const { vehicle, driver } = await generateTaxiandDriver({ x, y, z, heading: GetEntityHeading(player) });

  const maxNumberOfSeats = GetVehicleModelNumberOfSeats(vehicleHash);
  const playerSeat = maxNumberOfSeats - 2;

  SetPedIntoVehicle(player, vehicle, playerSeat);
  TaskVehicleDriveToCoordLongrange(driver, vehicle, waypointX, waypointY, waypointZ, maxSpeed, drivingStyle, 0);

  setTimeout(() => {
    SetRadioToStationName('OFF'); // turn off radio, no way to control right now so better to just turn it off
  }, 5000);

  while (!hasVehicleArrivedAtDestination(vehicle, [waypointX, waypointY, waypointZ]) && IsPedSittingInVehicle(player, vehicle)) {

    const vehicleSpeed = Math.max(maxSpeed * 0.5, GetEntitySpeed(vehicle)); // meters per second
    const [vehicleX, vehicleY, vehicleZ] = GetEntityCoords(vehicle);
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