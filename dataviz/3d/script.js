var data = [],
dates=[];

var controls;
var camera, scene, renderer, chart3d, newBar, plane;
var totalDays;

var barSize = 20,
 barPadding= 7,
 barScale = 6;

// эти методы нужны для D3-шных .append() и .selectAll()
THREE.Object3D.prototype.appendChild = function (c) { this.add(c); return c; };
THREE.Object3D.prototype.querySelectorAll = function () { return []; };

// а этот - для D3-шного .attr()
THREE.Object3D.prototype.setAttribute = function (name, value) {
    var chain = name.split('.');
    var object = this;
    for (var i = 0; i < chain.length - 1; i++) {
        object = object[chain[i]];
    }
    object[chain[chain.length - 1]] = value;
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
  return x - (totalDays * (barSize + barPadding) / 2);
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



function textSprite(text, params) {
    var font = "Helvetica",
        size = 18,
        color = "#676767";

    font = "bold " + size + "px " + font;

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
        side: THREE.DoubleSide
    }));

    console.log(canvas.width + 'x' + canvas.height);
    console.log(texture);
    console.log(mesh);

    return mesh;
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
    var font = "Helvetica",
        size = params.size,
        color = params.color;

    font = "bold " + size + "px " + font;

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
    // используем D3 для стоздания 3D столбцов
    d3.select( chart3d )
        .selectAll()
        .data(data)
    .enter().append( newBar )
        .attr("position.x", function(d, i) {   return toCenteredX(( barSize + barPadding) * (d[1]- 3)); })
        .attr("position.y", function(d, i) { return d[2] * barScale; })
        .attr("position.z", function(d, i) { return toCenteredX( d[0] * (barSize + barPadding) ); })
        .attr("scale.y", function(d, i) { return d[2] * barScale / barSize * 2; });


}

function init () {


    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.setClearColorHex( 0xffffff, 1 );
    

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );
    camera.position.z = 1100;
    camera.position.x = 400;
    camera.position.y = 800;
    
    scene = new THREE.Scene();
  

    globalObject = new THREE.Object3D();
    scene.add(globalObject);

    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0.2, 0.7, 0.8 );
    globalObject.add( light );

    var geometry = new THREE.CubeGeometry( barSize, barSize, barSize );
    var material = new THREE.MeshLambertMaterial( {
        color: 0x4682B4, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
    
    // создаём контейнер для 3D гистограммы
    chart3d = new THREE.Object3D();
    // chart3d.rotation.x = 0.6;
    // chart3d.rotation.y += 0.57;
    globalObject.add( chart3d );
    


    plane = new THREE.Mesh(
            new THREE.CubeGeometry(1800, 20, 1800),
            new THREE.MeshPhongMaterial({color:0xFFFFFF}));
    plane.position.y = -20;
    plane.receiveShadow = true;
    plane.doubleSided = true;
    plane.name = 'Plane';
    globalObject.add(plane);


     var label = textSprite("Openbeelab beehouse weight over time", {
      color: "#000",
      size: 50,
      posY: 30,
      posX: -100,
      posZ: 300,
     });
     plane.add(label);

    // init hour labels
    for (var i = 0; i < 24; i++) {

        var label = textSprite(i + 'H00', {
          color: "#000",
          size: barSize,
          posY: 30,
          posX: toCenteredX(-130),
          posZ:  toCenteredX(i * (barSize + barPadding)),
        });
        plane.add(label);


        var label = textSprite(i + 'H00', {
          color: "#000",
          size: barSize,
          posY: 30,
          posX: toCenteredX(totalDays * (barSize + barPadding) -50),
          posZ:  toCenteredX(i * (barSize + barPadding)),
        });
        plane.add(label);

    };

    for (var i = 0; i < dates.length; i++) {
        var label = textSprite(dates[i], {
          color: "#000",
          size: barSize - 3, 
          posY: 30,
          posX: toCenteredX(( barSize + barPadding) * (i- 3)),
          posZ: 180,
          rotZ:  Math.PI /2 
        });
        plane.add(label);
    };

    // drawHourLabel(10);

    // создаём функцию newBar() для D3
    newBar = function() { return new THREE.Mesh( geometry, material ); }

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

    // globalObject.rotation.y -= 0.001;

    controls.update();
    renderer.render( scene, camera );
    
}