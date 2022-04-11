import * as utils from './utils';

const driverPedModels: string[] = [
  'a_m_m_fatlatin_01',
  'a_m_m_socenlat_01',
  'a_m_m_stlat_02',
  'a_m_y_latino_01',
  'a_m_y_stlat_01'
];

const vehicleHash: string = 'TAXI'; // https://wiki.gtanet.work/index.php?title=Vehicle_Models
const drivingStyle: number = 787245; // https://vespura.com/fivem/drivingstyle/
const maximumSpeed: number = 22; // meters per second

RegisterCommand('taxi', async () => {
  let estimatedArrivalInMinutes: number = 0;

  const player: number = PlayerPedId();
  if (!player) {
    utils.errorMsg('Player not found');
    return;
  } // player not found

  const [ x, y, z ] = GetEntityCoords(player, true);

  const waypointBlip: number = GetFirstBlipInfoId(8);
  if (!waypointBlip) {
    utils.errorMsg('No waypoint found');
    return;
  } // no waypoint found

  const [waypointX, waypointY] = GetBlipInfoIdCoord(waypointBlip);
  const waypointZ = GetHeightmapBottomZForPosition(waypointX, waypointY);

  const [ vehicle, driver ] = await utils.generateVehicle(vehicleHash, [waypointX, waypointY, waypointZ], GetEntityHeading(player), driverPedModels[Math.floor(Math.random() * driverPedModels.length)]);

  const playerSeat: number = GetVehicleModelNumberOfSeats(vehicleHash) - 2; // Get the last available seat, minus the driver seat.

  SetPedIntoVehicle(player, vehicle, playerSeat);
  TaskVehicleDriveToCoordLongrange(driver, vehicle, waypointX, waypointY, waypointZ, maximumSpeed, drivingStyle, 0);

  while (!utils.hasVehicleArrivedAtDestination(vehicle, [ waypointX, waypointY, waypointZ ]) && IsPedSittingInVehicle(player, vehicle) && IsPedSittingInVehicle(driver, vehicle)) {
    
    const vehicleSpeed: number = Math.max(maximumSpeed * 0.5, GetEntitySpeed(vehicle)); // meters per second
    const [vehicleX, vehicleY, vehicleZ] = GetEntityCoords(vehicle, true);
    const distanceRemaining: number = CalculateTravelDistanceBetweenPoints(waypointX, waypointY, waypointZ, vehicleX, vehicleY, vehicleZ); // meters

    const timeRemainingInSeconds: number = (distanceRemaining / vehicleSpeed);
    estimatedArrivalInMinutes = timeRemainingInSeconds / 60;

    console.log({
      vehicleSpeed,
      distanceRemaining,
      timeRemainingInSeconds,
      estimatedArrivalInMinutes
    });

    await utils.Delay(500);
  }

  if (!IsPedSittingInVehicle(player, vehicle)) {
    utils.infoMsg('Journey ended early - you left the vehicle');
    SetVehicleAsNoLongerNeeded(vehicle);
    SetPedAsNoLongerNeeded(driver);
    return;
  }

  const location: string = utils.getLocationFromCoords(waypointX, waypointY, waypointZ);
  utils.successMsg(`You have arrived at ${location}.`);

  console.log('parking vehicle');
  const vehicleHeading: number = GetEntityHeading(vehicle);
  TaskVehiclePark(driver, vehicle, waypointX, waypointY, waypointZ, vehicleHeading, 0, 20, true);

  while (!IsVehicleStopped(vehicle)) await utils.Delay(50);

  console.log('Player leaving vehicle');
  TaskLeaveVehicle(player, vehicle, 0);

  while (!IsPedSittingInVehicle(player, vehicle)) await utils.Delay(500);

  console.log('Setting Vehicle and Driver as no longer needed');
  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
}, false);