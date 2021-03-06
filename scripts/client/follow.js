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

  const [x, y, z] = GetEntityCoords(player);

  const mode = args[1] || 'normal';

  let vehicleOverride = 'DOMINATOR';
  let pedOverride = 'player_one';
  let seatOverride = null;

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
    case 'halftrack':
      pedOverride = 'player_one';
      vehicleOverride = 'HALFTRACK';
      seatOverride = 1;
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

  const playerName = GetPlayerName(targetPlayer);

  const [vehicle, driver] = await generateVehicle(vehicleOverride, [x, y, z], GetEntityHeading(player), pedOverride);

    SendNuiMessage(JSON.stringify({
      type: 'open',
      ui: 'follow'
    }));

  SetVehicleNumberPlateText(vehicle, 'GAY');
  SetVehicleTyresCanBurst(vehicle, false);

  ModifyVehicleTopSpeed(vehicle, 600);

  SetPedIntoVehicle(player, vehicle, seatOverride || 0);
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
    const [year, month, day, hour, minute, second] = GetUtcTime();

    const time = `${hour}:${minute}:${ second < 10 ? '0' + second : second }`;

    SetVehicleNumberPlateText(vehicle, time);

    counter += 1;
    SetVehicleCheatPowerIncrease(vehicle, 1024);
    [targetX, targetY, targetZ] = GetEntityCoords(targetPed);

    const [vehicleX, vehicleY, vehicleZ] = GetEntityCoords(vehicle);
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
      memory.lastTargetLocation = [targetX, targetY, targetZ];
    } else if ((distance >= 100000) || (changeInMemory && taxiTravelMode === 'waypoint')) {
      taxiTravelMode = 'waypoint';
      TaskVehicleDriveToCoordLongrange(driver, vehicle, targetX, targetY, targetZ, 600, style, 0);
      memory.lastDrivingStyle = distanceStyle;
      memory.lastTravelModel = 'waypoint';
      memory.lastTargetLocation = [targetX, targetY, targetZ];
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

    SendNuiMessage(JSON.stringify({
      type: 'update',
      ui: 'follow',
      data: {
        playerName,
        distance,
        mode: distance > 1000 ? 'search' : distanceStyle
      }
    }));

    await Delay(0);
  }

    SendNuiMessage(JSON.stringify({
      type: 'close',
      ui: 'follow'
    }));

  TaskLeaveVehicle(player, vehicle, 0);

  SetVehicleAsNoLongerNeeded(vehicle);
  SetPedAsNoLongerNeeded(driver);
})