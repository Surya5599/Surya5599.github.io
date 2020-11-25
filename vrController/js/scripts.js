window.onload = (event) => {
  var x = document.getElementById("x_val");
  var y = document.getElementById("y_val");
  var z = document.getElementById("z_val");

  let sensor = new Gyroscope();
  sensor.start();

  sensor.onreading = () => {
      console.log("Angular velocity around the X-axis " + sensor.x);
      console.log("Angular velocity around the Y-axis " + sensor.y);
      console.log("Angular velocity around the Z-axis " + sensor.z);
  };

  sensor.onerror = event => console.log(event.error.name, event.error.message);

};



