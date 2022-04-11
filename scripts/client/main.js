// RegisterCommand('kill', async (source) => {
//   const player = PlayerPedId();

//   if (!HasPedGotWeapon(player, GetHashKey('WEAPON_PISTOL'), false)) GiveWeaponToPed(player, GetHashKey('WEAPON_PISTOL'), 1, false, false);

//   SetCurrentPedWeapon(player, GetHashKey('WEAPON_PISTOL'), true);

//   RequestAnimDict('mp_suicide');
//   while (!HasAnimDictLoaded('mp_suicide')) await Delay(500)

//   TaskPlayAnim(player, "mp_suicide", "pistol", 8.0, 1.0, -1, 2, 0, 0, 0, 0 )
//   await Delay(750)
//   SetPedShootsAtCoord(player, 0.0, 0.0, 0.0, 0)
//   SetEntityHealth(player, 0)
// })