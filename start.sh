sleep 55
cd /home/intel/Downloads/gateway-middleware
date
echo 346 > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio346/direction
sudo forever start -p /home/intel/Downloads/gateway-middleware -l forever.log -a main.js