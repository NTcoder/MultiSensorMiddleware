// main contanins the control flow only, (which inculdes whitelisting logic, cloud adaptor initialisation, and wireless protocol initialisation(BLE,ZIGBEE))
//      rest all device specific libraries are plugin for more information go to specific imports
var noble = require('noble');
var config = require('./config');
var SensorTag2650 = require('./PluginGateway/Bluetooth/SensorTag2650');
var SensorTag1350 = require('./PluginGateway/Bluetooth/SensorTag1350');
var ThunderboardReact = require('./PluginGateway/Bluetooth/ThunderReact');
var ThunderboardSense = require('./PluginGateway/Bluetooth/ThunderSense');
var XDK = require('./PluginGateway/Bluetooth/XDK');
var CloudAdaptor = require('./PluginGateway/Cloud/KafkaAdaptor');
var SensorDataStructure = require('./PluginGateway/SensorDataStructure/Json');
var CloudLed = require('./PluginGateway/Cloud/CloudLed');
var whitelistAddressAll = [];
var whitelistContentAll = [];
var UpdateIP = require('./PluginGateway/Cloud/UpdateIP');
var GetWhiteList = require('./PluginGateway/Cloud/GetWhiteList');
const CompatibleSensors = [];
var DiscoveredPeripheral = [];
var allowDuplicates = true;
//function which retireves the whitelist address from the api and saves to file "whitelist.json", and updates the global variable "whitelistAddressAll,whitelistContentAll"
//cb is the callback function after the getwhitelist for updating the global variables
function cb(whitelistaddresses,whitelistContent){
	console.log("Following whitelisted addresses found :",whitelistaddresses);
	whitelistAddressAll = whitelistaddresses;
	whitelistContentAll = whitelistContent;
}

//BLE APP is the main app which start the BLE thread
function BLEApp (){
	/*
	noble.on('stateChange', function(state) {
		if (state === 'poweredOn') {
		console.log("Adaptor State Changed to :", state);
		//noble.startScanning(allowDuplicates);
		setTimeout( function() { noble.startScanning()},2000);
				console.log("started scanning for ble sevices with following whitelisted address :",whitelistAddressAll);
		} else {
			noble.stopScanning();
		}
	});
	*/
	
	//start scanning for ble services
	noble.startScanning(null,allowDuplicates);
	console.log("started scanning for ble sevices with following whitelisted address :",whitelistAddressAll);
	//callback when BLE scan discovers a new ble device, return a peripheral object
	noble.on('discover',function(peripheral) { 
		// search for the local devices at, if it is a whitelisted address, connect to its specific sensor library
		var index = whitelistAddressAll.indexOf(peripheral.id);
		if (index == -1){
			// condition when the device found is not in whitelist
			console.log('Found device with local name which is not a whitelist : '+ peripheral.id);
			//create a array for the devices which are discovered now, but may have been whitelisted in runtime later
			// NOTE : It may create large memory if so many decvices are discovered over time, should apply filter in the device name
			if (CompatibleSensors.indexOf(peripheral.advertisement.localName) !== -1){
				DiscoveredPeripheral.push(peripheral);
				//console.log(DiscoveredPeripheral);
			}
		}else{
			// check for particular case of the whitelist address
			if (whitelistContentAll[index].sname == "SensorTag2650"){
				var ST_2650_DS = new SensorDataStructure();
				var ST_2650_CloudAdaptor = new CloudAdaptor();
				var ST_2650_Handle = new SensorTag2650();
				ST_2650_Handle.SensorTagHandle2650(peripheral,ST_2650_CloudAdaptor.kafkaHandle,ST_2650_DS.JSON_data);
			}else if (whitelistContentAll[index].sname == "SensorTag1350"){
				var ST1350_DS = new SensorDataStructure();
				var ST1350_CloudAdaptor = new CloudAdaptor();
				var ST1350_Handle = new SensorTag1350();
				ST1350_Handle.SensorTagHandle1350(peripheral,ST1350_CloudAdaptor.kafkaHandle,ST1350_DS.JSON_data);
			}else if (whitelistContentAll[index].sname == "Bosch-XDK"){
				var XDK_DS = new SensorDataStructure();
				var XDK_CloudAdaptor = new CloudAdaptor();
				var XDK_Handle = new XDK();
				XDK_Handle.XDKHandle(peripheral,XDK_CloudAdaptor.kafkaHandle,XDK_DS.JSON_data);
			}else if (whitelistContentAll[index].sname == "ThunderBoard-React"){
			//if (peripheral.id == "000b571c53ae"){ // for testing the sensor locally without whitelisting
				var ThunderboardReact_DS = new SensorDataStructure();
				var ThunderboardReact_CloudAdaptor = new CloudAdaptor();
				var ThunderboardReact_Handle = new ThunderboardReact();
				ThunderboardReact_Handle.ThunderboardReactHandle(peripheral,ThunderboardReact_CloudAdaptor.kafkaHandle,ThunderboardReact_DS.JSON_data);
			}else if (whitelistContentAll[index].sname == "ThunderBoard-Sense"){
				var ThunderboardSense_DS = new SensorDataStructure();
				var ThunderboardSense_CloudAdaptor = new CloudAdaptor();
				var ThunderboardSense_Handle = new ThunderboardSense();
				ThunderboardSense_Handle.ThunderboardSenseHandle(peripheral,ThunderboardSense_CloudAdaptor.kafkaHandle,ThunderboardSense_DS.JSON_data);
			}else{
			//console.log(peripheral);
			// logs the issue when the particular BLE device is whitelisted but its corresponding BLE library is not found
			console.log('No compatible library for this sensor: ', peripheral.advertisement.localName,peripheral.id);
			}	
		}
	});
	
	// check for a message, removed beacuse already implemented in noble internally
	/*
	noble.on('warning',function(message){
		console.log(message);
	});
	*/

	// if a scan stop happens internally in a BLE stack for unknown reasons, start scanning again after a timeout
	// NOTE: not to be used with state change listener
	noble.on('scanStop', function(){
		console.log("Scanning Stopped");
		setTimeout(function(){
			noble.startScanning();
		},2000);
	});

};

//Switch off the Cloud Led as the cloud is yet to start
CloudLed("0");
//call the Update IP on cloud
UpdateIP();
//update the IP every 3minutes
setInterval(function(){UpdateIP()},120000);
// call the get whitelist
GetWhiteList(cb);

// call the get whitelist regularly
setInterval(function(){GetWhiteList(cb)},30000);
// constructor for cloud init
var CloudInit = new CloudAdaptor();

// call the particular cloud init process
CloudInit.kafkaInit(function (){
	// start the local protocol app
	CloudLed("1");//Power on the cloud led as the cloud init is now successful
	BLEApp();
});

