var data = [];

var globalObject, down;
var camera, scene, renderer, chart3d, newBar;
 
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
    
    for (var i = 0; i < 23; i++) {
        data.push([i, j, d[i] ]);
    };

  });

  init();
  update();
  animate();

});


function update () {
    // используем D3 для стоздания 3D столбцов
    d3.select( chart3d )
        .selectAll()
        .data(data)
    .enter().append( newBar )
        .attr("position.x", function(d, i) {   return 30 * (d[1]- 3); })
        .attr("position.y", function(d, i) { return d[2] * 4; })
        .attr("position.z", function(d, i) { return d[0] * 30; })
        .attr("scale.y", function(d, i) { return d[2] * 4 / 10; })
}

function init () {


    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.setClearColorHex( 0xffffff, 1 );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );
    camera.position.z = 1300;
    camera.position.x = 400;
    camera.position.y = -100;
    
    scene = new THREE.Scene();
  

    globalObject = new THREE.Object3D();
    scene.add(globalObject);

    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0.6, 1 );
    globalObject.add( light );

    var geometry = new THREE.CubeGeometry( 28, 28, 28 );
    var material = new THREE.MeshLambertMaterial( {
        color: 0x4682B4, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
    
    // создаём контейнер для 3D гистограммы
    chart3d = new THREE.Object3D();
    chart3d.rotation.x = 0.6;
    chart3d.rotation.y += 0.57;
    globalObject.add( chart3d );
    

    // создаём функцию newBar() для D3
    newBar = function() { return new THREE.Mesh( geometry, material ); }

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize () {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    
}


window.onmousedown = function (ev) {
    down = true;
    sx = ev.clientX;
    sy = ev.clientY;
};

window.onmouseup = function () {
    down = false;
};

window.onmousemove = function (ev) {
    if (down) {
        var dx = ev.clientX - sx;
        var dy = ev.clientY - sy;
        globalObject.rotation.y += dx * 0.01;
        camera.position.y += dy;
        sx += dx;
        sy += dy;
    }
}

function animate () {
    
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    
}