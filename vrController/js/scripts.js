window.onload = (event) => {
  var x = document.getElementById("x_val");
  var y = document.getElementById("y_val");
  var z = document.getElementById("z_val");

  //let sensor = new Gyroscope();
  let sensor = new AbsoluteOrientationSensor({frequency: 60});
  sensor.start();
  
  sensor.onreading = () => {    
    sensor.onreading = () => model.quaternion.fromArray(sensor.quaternion);
  };

  sensor.onerror = event => console.log(event.error.name, event.error.message);
  


};



