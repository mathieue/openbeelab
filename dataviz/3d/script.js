var data = [],
dates=[];

var controls;
var camera, scene, renderer, chart3d, newBar, plane;
var totalDays;

var materials = [];
var myscale;

var barSize = 28,
textSize = barSize * 0.5,
textLabelTileSize = textSize * 4,
 barPadding= 0,
 barScale = 5;

// BOUNDS
var maxX, maxY, maxZ;

var minValue;

var labelColor = '#000000',
    barColor =  '#b92a84',
    backroundColor = "#f8f9f9",
    planeColor = "#eee";

// эти методы нужны для D3-шных .append() и .selectAll()
THREE.Object3D.prototype.appendChild = function (c) { this.add(c); return c; };
THREE.Object3D.prototype.querySelectorAll = function () { return []; };

// а этот - для D3-шного .attr()
THREE.Object3D.prototype.setAttribute = function (name, value) {
    var chain = name.split('.');
    var object = this;

    if (name == 'color') {
       // this.material.opacity = 0.5;
       var index = Math.ceil(myscale(value));
       if (index) {
       this.material = materials[index]; ;
       }
       
    }
    else {
      for (var i = 0; i < chain.length - 1; i++) {
        object = object[chain[i]];
      }
      object[chain[chain.length - 1]] = value;    
    }
}

d3.csv("3d.csv", function(error, csvdata) {
  csvdata.forEach(function(d, j) {
    
    for (var i = 0; i < 24; i++) {
        data.push([i, j, d[i] ]);
        if (i == 0) {
          dates.push(d['time-copy']);
        }
    };

  });
  
  totalDays = csvdata.length;

  console.log(dates);

  init();
  update();
  animate();

});



function toCenteredX(x) {
  return x - maxX / 2;
}

function toCenteredZ(x) {
  return x - maxZ / 2;
}


function drawXLabel(x, length) {
    //Marks A-J on the graph
    var c = String.fromCharCode(x + 65);
    var title = alignPlane(createText2D(c), THREE.CenterAlign, THREE.CenterAlign);
    title.scale.set(0.25, 0.25, 0.25);
    title.position.x = (x - (length.x - 1) / 2) * 16;
    title.position.z = -(-1 - (length.y - 1) / 2) * 16;
    title.position.y = 1;
    title.rotation.x = -Math.PI / 2;
    scene.add(title);
}

function createTextCanvas(text, color, font, size) {
    size = size || 24;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size * 1.25);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, size);
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshBasicMaterial({
        map:tex, color:0xffffff, transparent:true
    });
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.doubleSided = true;
    return mesh;
}

function alignPlane(plane, horizontalAlign, verticalAlign) {
    var obj = new THREE.Object3D();
    var u = plane.geometry.vertices[0];
    var v = plane.geometry.vertices[plane.geometry.vertices.length - 1];
    var width = Math.abs(u.x - v.x);
    var height = Math.abs(u.y - v.y);
    plane.position.x = (width / 2) * horizontalAlign;
    plane.position.y = (height / 2) * verticalAlign;
    obj.add(plane);
    return obj;
}



function drawHourLabel(hour) {
  var canvas = document.createElement('canvas');
  var size = 256; // CHANGED
  canvas.width = size;
  canvas.height = size;
  var context = canvas.getContext('2d');
  context.fillStyle = '#000000'; // CHANGED
  context.textAlign = 'center';
  context.font = '24px Arial';
  context.fillText("some text", size / 2, size / 2);
  
  var amap = new THREE.Texture(canvas);
  amap.needsUpdate = true;
  
  var mat = new THREE.SpriteMaterial({
      map: amap,
      transparent: false,
      useScreenCoordinates: false,
      color: 0xffffff // CHANGED
  });
  
  var sp = new THREE.Sprite(mat);
  sp.scale.set( 300, 300, 300 ); // CHANGED
  plane.add(sp);
}


function textSprite(text, params) {
    var font = "Arial",
        size = params.size,
        color = params.color;

    font = " " + size + "px " + font;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;

    // get size data (height depends only on font size)
    var metrics = context.measureText(text),
        textWidth = metrics.width;

    canvas.width = textWidth + 3;
    canvas.height = size + 3;

    context.font = font;
    context.fillStyle = color;

    context.fillText(text, 0, size + 3);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(canvas.width, canvas.height),
    new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
    }));

    console.log(canvas.width + 'x' + canvas.height);
    console.log(texture);
    console.log(mesh);

    mesh.rotation.x = - Math.PI / 2;
    mesh.position.y += params.posY;
    mesh.position.x += params.posX;
    mesh.position.z += params.posZ;
    if (params.rotZ) {
      mesh.rotation.z += params.rotZ;
    }

    return mesh;
}



function update () {

var brewer = colorbrewer.Oranges[9];

  var maxy = d3.max( data, function(d) { return parseFloat(d[2]); });
  var miny = d3.min( data, function(d) { return parseFloat(d[2]); });




  myscale = d3.scale.linear()
    .domain([miny, maxy])
    .range([0, brewer.length - 1]);


for (var i = 0; i < brewer.length; i++) {
  var material = new THREE.MeshLambertMaterial( {color: brewer[i] , shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
  materials.push(material) ;
 }                     


    d3.select( chart3d )
        .selectAll()
        .data(data)
    .enter().append( newBar  )
        .attr("position.x", function(d, i) {   return toCenteredX(( barSize + barPadding) * (d[1])); })
        .attr("position.y", function(d, i) { return d[2] * barScale; })
        .attr("position.z", function(d, i) { return toCenteredZ( d[0] * (barSize + barPadding) ); })
        .attr("scale.y", function(d, i) { return d[2] * barScale / barSize * 2; })
        .attr("color", function(d, i) { return  parseFloat(d[2] ) });


}

function init () {


    // BOUNDS    

    minValue = d3.min( data, function(d) { return parseFloat(d[2]); });
    maxValue = d3.max( data, function(d) { return parseFloat(d[2]); });

    maxX = ( barSize + barPadding) * totalDays;
    maxY = maxValue * barScale * 2 + barSize / 2;
    maxZ = 24 * (barSize + barPadding);

    var paddingPlan = barSize * 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('3dviz').appendChild( renderer.domElement );

    renderer.setClearColorHex( 0xffffff, 1 );
    

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight , 1, 50000 );
    camera.position.z = maxZ * 1.5;
    camera.position.x = maxX / 2;
    camera.position.y = maxY * 2.1;
    
    scene = new THREE.Scene();
  


    globalObject = new THREE.Object3D();
    // globalObject.position.y -= 200;
    scene.add(globalObject);


   var light = new THREE.PointLight(0xffffff);
   light.position.set(100,1500,1000);
    scene.add( light );

   var light = new THREE.PointLight(0xffffff);
   light.position.set(-5000,-1500,-1000);
    scene.add( light );


   var light = new THREE.PointLight(0xffffff);
   light.position.set(-10,1500,-1000);
    scene.add( light );

    // var light = new THREE.DirectionalLight( 0xffffff );
    // light.position.set( 20000, 70000, 80000 );


  // SKYBOX



  var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
  var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: backroundColor, side: THREE.BackSide } );
  var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
  scene.add(skyBox);

    var geometry = new THREE.CubeGeometry( barSize, barSize, barSize );


    var material = new THREE.MeshLambertMaterial( {
        color: barColor, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
    // var material = new THREE.MeshPhongMaterial( { color: barColor} );
    
    // создаём контейнер для 3D гистограммы
    chart3d = new THREE.Object3D();
    // chart3d.rotation.x = 0.6;
    // chart3d.rotation.y += 0.57;
    globalObject.add( chart3d );
    

  // var width = max; 

    plane = new THREE.Mesh(
            new THREE.CubeGeometry(maxX + paddingPlan, 20, maxZ + paddingPlan),
            new THREE.MeshBasicMaterial({color: planeColor}));

    // plane.position.y -= 40;
    // plane.position.z += (width / 2);
    // plane.position.x += (width / 2);
    plane.receiveShadow = true;
    plane.doubleSided = true;
    plane.name = 'Plane';
    globalObject.add(plane);

    // GRID

    // TITLE

     var label = textSprite("OPENBEELAB BEEHOUSE WEIGHT OVER TIME", {
      color: labelColor,
      size: (textSize * 4),
      posY: maxY + textSize * 3,
      posX: 0,
      posZ: toCenteredZ(0),
     });

     label.rotation.x -= Math.PI / 2 * 3;

     plane.add(label);


    // TITLE DAYS
     var label = textSprite("DAYS", {
      color: labelColor,
          size: textLabelTileSize , 
          posY: 0,
          posX: toCenteredX(( barSize + barPadding) * (dates.length / 2)),
          posZ: toCenteredZ(maxZ + paddingPlan - textLabelTileSize)
          // rotZ:  Math.PI /2 
        });
      plane.add(label);

    // TITLE HOURS
     var label = textSprite("HOURS", {
      color: labelColor,
          size: textLabelTileSize , 
          posY: 0,
          posX: toCenteredX(- paddingPlan) ,
          posZ: toCenteredZ(12 * (barSize + barPadding)),
         rotZ:  Math.PI /2 
        });
      plane.add(label);

     var label = textSprite("HOURS", {
      color: labelColor,
          size: textLabelTileSize , 
          posY: 0,
          posX: toCenteredX(maxX + paddingPlan - textLabelTileSize) ,
          posZ: toCenteredZ(12 * (barSize + barPadding)),
         rotZ:  Math.PI /2 
        });
      plane.add(label);



    // HOUR LABELS

    for (var i = 0; i < 24; i++) {

        var label = textSprite(i + 'H00', {
          color: labelColor,
          size: textSize,
          posY: 30,
          posX: toCenteredX(-barSize * 2) ,
          posZ:  toCenteredZ(i * (barSize + barPadding)),
        });
        plane.add(label);


        var label = textSprite(i + 'H00', {
          color: labelColor,
          size: textSize,
          posY: 30,
          posX: toCenteredX(maxX + barSize ),
          posZ:  toCenteredZ(i * (barSize + barPadding)),
        });
        plane.add(label);

    };


    // DATE LABELS
    for (var i = 0; i < dates.length; i++) {
        var label = textSprite(dates[i], {
          color: labelColor,
          size: textSize , 
          posY: 30,
          posX: toCenteredX(( barSize + barPadding) * (i)),
          posZ: toCenteredZ(maxZ + barSize * 2),
          rotZ:  Math.PI /2 
        });
        plane.add(label);
    };

    // drawHourLabel(10);

    // создаём функцию newBar() для D3
    newBar = function() { return new THREE.Mesh( geometry,    new THREE.MeshLambertMaterial( {
        color: barColor, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } ) ); }

    controls = new THREE.OrbitControls(camera);

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize () {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    
}


function animate () {
    
    requestAnimationFrame( animate );

    globalObject.rotation.y -= 0.001;
    // globalObject.rotation.x -= 0.0005;

    // controls.update();
    renderer.render( scene, camera );
    
}