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

const positionVariation = 30;

AddRelationshipGroup('WSKY_TAXI_DRIVER');
SetRelationshipBetweenGroups(0, GetHashKey('WSKY_TAXI_DRIVER'), GetHashKey('PLAYER'));
SetRelationshipBetweenGroups(0, GetHashKey('PLAYER'), GetHashKey('WSKY_TAXI_DRIVER'));

async function generateVehicle (vehicleModel, position, heading, pedModel) {
  const [ x, y, z ] = position;
  if (!x || !y || !z) throw new Error('Invalid position');

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

  let driver = null;

  // If a ped model is specified, create the ped.
  if (pedModel) {
    driver = CreatePedInsideVehicle(vehicle, 4, pedModel, -1, true, true);
    SetPedRelationshipGroupHash(driver, GetHashKey('WSKY_TAXI_DRIVER'));

    TaskSetBlockingOfNonTemporaryEvents(driver, true); // Prevent the ped from fleeing. (doesn't really work...)
  }

  return driver ? [vehicle, driver] : [vehicle];
}

function getDistance (location1, location2) {
  const [x1, y1, z1] = location1;
  const [x2, y2, z2] = location2;

  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
}

function hasVehicleArrivedAtDestination (vehicle, destination) {
  const vehiclePos = GetEntityCoords(vehicle, true);
  const distance = getDistance(vehiclePos, destination);
  return distance <= positionVariance;
}

function getLocationFromCoords (x, y, z) {
  const zoneId = GetNameOfZone(x, y, z);
  const zoneName = zoneId ? GetLabelText(zoneId) : null;

  const [streetNameHash] = GetStreetNameAtCoord(x, y, z);
  const streetName = GetStreetNameFromHashKey(streetNameHash);

  let location = 'your destination';

  if (streetName) location = streetName;
  if (streetName && zoneName) location = `${streetName}, ${zoneName}`;
  else if (zoneName) location = zoneName;

  return location;
}