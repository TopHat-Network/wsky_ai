(()=>{var e={979:function(e,t,o){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,o,n){void 0===n&&(n=o);var r=Object.getOwnPropertyDescriptor(t,o);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[o]}}),Object.defineProperty(e,n,r)}:function(e,t,o,n){void 0===n&&(n=o),e[n]=t[o]}),r=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),i=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&n(t,e,o);return r(t,e),t},s=this&&this.__awaiter||function(e,t,o,n){return new(o||(o=Promise))((function(r,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?r(e.value):(t=e.value,t instanceof o?t:new o((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0});const a=i(o(99));RegisterCommand("taxi",(()=>s(void 0,void 0,void 0,(function*(){console.log("step 1");const e=PlayerPedId();if(!e)return void a.errorMsg("Player not found");console.log("step 2");const[t,o,n]=GetEntityCoords(e,!0),r=GetFirstBlipInfoId(8);if(!r)return void a.errorMsg("No waypoint found");console.log("step 3");const[i,s]=GetBlipInfoIdCoord(r),c=GetHeightmapBottomZForPosition(i,s);console.log("step 4"),console.log({player:e,x:t,y:o,z:n,waypointX:i,waypointY:s,waypointZ:c,waypointBlip:r})}))),!1)},99:function(e,t){"use strict";var o=this&&this.__awaiter||function(e,t,o,n){return new(o||(o=Promise))((function(r,i){function s(e){try{c(n.next(e))}catch(e){i(e)}}function a(e){try{c(n.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?r(e.value):(t=e.value,t instanceof o?t:new o((function(e){e(t)}))).then(s,a)}c((n=n.apply(e,t||[])).next())}))};function n(e){return o(this,void 0,void 0,(function*(){new Promise((t=>setTimeout(t,e)))}))}function r(e,t){const[o,n,r]=e,[i,s,a]=t;return Math.sqrt(Math.pow(o-i,2)+Math.pow(n-s,2)+Math.pow(r-a,2))}Object.defineProperty(t,"__esModule",{value:!0}),t.getLocationFromCoords=t.hasVehicleArrivedAtDestination=t.getDistance=t.generateVehicle=t.successMsg=t.infoMsg=t.errorMsg=t.Delay=void 0,t.Delay=n,t.errorMsg=function(e){emit("chat:addMessage",{args:["Error",e],color:[255,0,0]})},t.infoMsg=function(e){emit("chat:addMessage",{args:["Info",e],color:[0,255,255]})},t.successMsg=function(e){emit("chat:addMessage",{args:["Success",e],color:[0,255,0]})},AddRelationshipGroup("WSKY_TAXI_DRIVER"),SetRelationshipBetweenGroups(0,GetHashKey("WSKY_TAXI_DRIVER"),GetHashKey("PLAYER")),SetRelationshipBetweenGroups(0,GetHashKey("PLAYER"),GetHashKey("WSKY_TAXI_DRIVER")),t.generateVehicle=function(e,t,r,i){return o(this,void 0,void 0,(function*(){console.log("step 1");const[o,s,a]=t;for(RequestModel(e),console.log("step 2");!HasModelLoaded(e);)yield n(500);if(console.log("step 3"),i){for(RequestModel(i),console.log("step 3.1");!HasModelLoaded(i);)yield n(500);console.log("step 3.2")}console.log("step 4");const c=CreateVehicle(GetHashKey(e),o,s,a,r||0,!0,!0);let l=null;return console.log("step 5"),i&&(console.log("step 5.1"),l=CreatePedInsideVehicle(c,4,i,-1,!0,!0),SetPedRelationshipGroupHash(l,GetHashKey("WSKY_TAXI_DRIVER")),TaskSetBlockingOfNonTemporaryEvents(l,!0),console.log("step 5.2")),l?[c,l]:[c]}))},t.getDistance=r,t.hasVehicleArrivedAtDestination=function(e,t){return r(GetEntityCoords(e,!0),t)<=30},t.getLocationFromCoords=function(e,t,o){const n=GetNameOfZone(e,t,o),r=n?GetLabelText(n):null,[i]=GetStreetNameAtCoord(e,t,o),s=GetStreetNameFromHashKey(i);let a="your destination";return s&&(a=s),s&&r?a=`${s}, ${r}`:r&&(a=r),a}}},t={};!function o(n){var r=t[n];if(void 0!==r)return r.exports;var i=t[n]={exports:{}};return e[n].call(i.exports,i,i.exports,o),i.exports}(979)})();