var kafka = require('kafka-node');
function kafkaHandle(json_data){
	payloads = [{ topic: 'intel', messages: JSON.stringify(json_data) , partition: 0 }];
	//console.log("inside kafka send");
	producer.send(payloads, function (err, data) {
	if (err)
		console.log("Kafka Clinet Error :", err);
	console.log(data, payloads);
	});
};
function JSON_data(sensorid,sname,sensorservice,sensordata){
	json_data = {   "versionId":"1.0.0",
					"gatewayId":12345,
					//"gps":[{"longuitude":Math.floor((Math.random() * 180) - 90),"latitude": Math.floor((Math.random() * 180) -90)}],	
				 	"gps":[{"longuitude":18.5568,"latitude":73.7935}],
					"sserialno":sensorid,
					"sname":sname,
					"datatype":sensorservice,
					"data": sensordata,
					"timestamp": new Date()
					};
	//console.log(json_data);
	return json_data
};
function kafkaInit(){
	Producer = kafka.Producer;
	KeyedMessage = kafka.KeyedMessage;
	client = new kafka.Client("52.184.198.111:2181");
	producer = new Producer(client);
	console.log("Producer initialising")
};
kafkaInit();
producer.on('ready',function(){
	console.log("producer initialised");
	setInterval( function () {
		//kafkaHandle(JSON_data("247189586f00","SensorTag1350","Temperature",Math.floor(Math.random()*29)));
		//kafkaHandle(JSON_data("fed6bd1006e3","Bosch-XDK","Accelerometer",{x:Math.floor(Math.random()*15),y:Math.floor(Math.random()*16),z:Math.floor(Math.random()*23)}));
		kafkaHandle(JSON_data("000b571cb747","ThunderBoard-React","Humidity",Math.floor(Math.random()*50)));
	},500);
});
//kafkaHandle(JSON_data(peripheral.address,"ThunderboardReact","Temperature",data.readUInt16LE()));