const Delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const errorMsg = (msg: string) => emit('chat:addMessage', {
  args: [
    'Error',
    msg
  ],
  color: [255, 0, 0]
});
const infoMsg = (msg: string) => emit('chat:addMessage', {
  args: [
    'Info',
    msg
  ],
  color: [0, 255, 255]
});
const successMsg = (msg: string) => emit('chat:addMessage', {
  args: [
    'Success',
    msg
  ],
  color: [0, 255, 0]
});

// Setup the relationship group for the taxi driver.
AddRelationshipGroup('WSKY_TAXI_DRIVER');

// Set the players and taxi driver as companions, so they don't panic and flee at player aggression.
SetRelationshipBetweenGroups(0, GetHashKey('WSKY_TAXI_DRIVER'), GetHashKey('PLAYER'));
SetRelationshipBetweenGroups(0, GetHashKey('PLAYER'), GetHashKey('WSKY_TAXI_DRIVER'));

async function generateVehicle(vehicleModel: string, position: [x: number, y: number, z: number], heading: number, pedModel?: string) {
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