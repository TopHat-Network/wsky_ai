export function Delay (ms: number) {
  new Promise(resolve => setTimeout(resolve, ms));
}
export function errorMsg (msg: string) {
  emit('chat:addMessage', {
    args: [
      'Error',
      msg
    ],
    color: [255, 0, 0]
  });
}
export function infoMsg (msg: string) {
  emit('chat:addMessage', {
    args: [
      'Info',
      msg
    ],
    color: [0, 255, 255]
  });
}
export function successMsg (msg: string) {
  emit('chat:addMessage', {
    args: [
      'Success',
      msg
    ],
    color: [0, 255, 0]
  });
}

const positionVariance: number = 30; // meters

// Setup the relationship group for the taxi driver.
AddRelationshipGroup('WSKY_TAXI_DRIVER');

// Set the players and taxi driver as companions, so they don't panic and flee at player aggression.
SetRelationshipBetweenGroups(0, GetHashKey('WSKY_TAXI_DRIVER'), GetHashKey('PLAYER'));
SetRelationshipBetweenGroups(0, GetHashKey('PLAYER'), GetHashKey('WSKY_TAXI_DRIVER'));

export async function generateVehicle(vehicleModel: string, position: [x: number, y: number, z: number], heading: number, pedModel?: string) {
  const [ x, y, z ] = position;
  
  // Load the vehicle model, and wait until it's loaded.
  RequestModel(vehicleModel);
  while (!HasModelLoaded(vehicleModel)) await Delay(500);

  // If a ped model is specified, load it.
  if (pedModel) {
    RequestModel(pedModel);
    while (!HasModelLoaded(pedModel)) await Delay(500);
  }

  // Create the vehicle.
  const vehicle = CreateVehicle(GetHashKey(vehicleModel), x, y, z, heading || 0.0, true, true);

  let driver: number = null;

  // If a ped model is specified, create the ped.
  if (pedModel) {
    driver = CreatePedInsideVehicle(vehicle, 4, pedModel, -1, true, true);
    SetPedRelationshipGroupHash(driver, GetHashKey('WSKY_TAXI_DRIVER'));

    TaskSetBlockingOfNonTemporaryEvents(driver, true); // Prevent the ped from fleeing. (doesn't really work...)
  }

  return driver ? [ vehicle, driver ] : [ vehicle ];
}

export function getDistance(location1: [x: number, y: number, z: number], location2: [x: number, y: number, z: number]) {
  const [ x1, y1, z1 ] = location1;
  const [ x2, y2, z2 ] = location2;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
}

export function hasVehicleArrivedAtDestination(vehicle: number, destination: [x: number, y: number, z: number]) {
  const vehiclePos = GetEntityCoords(vehicle, true) as [x: number, y: number, z: number];
  const distance = getDistance(vehiclePos, destination);
  return distance <= positionVariance;
}

export function getLocationFromCoords(x: number, y: number, z: number) {
  const zoneId: string = GetNameOfZone(x, y, z);
  const zoneName: string = zoneId ? GetLabelText(zoneId) : null;

  const [streetNameHash] = GetStreetNameAtCoord(x, y, z);
  const streetName: string = GetStreetNameFromHashKey(streetNameHash);

  let location: string = 'your destination';

  if (streetName) location = streetName;
  if (streetName && zoneName) location = `${streetName}, ${zoneName}`;
  else if (zoneName) location = zoneName;

  return location;
}