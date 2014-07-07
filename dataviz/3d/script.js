var data = [4, 8, 15, 16, 23, 42];

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

init();
update();
animate();

function update () {
    // используем D3 для стоздания 3D столбцов
    d3.select( chart3d )
        .selectAll()
        .data(data)
    .enter().append( newBar )
        .attr("position.x", function(d, i) { return 30 * (i - 3); })
        .attr("position.y", function(d, i) { return d; })
        .attr("scale.y", function(d, i) { return d / 10; })
}

function init () {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 400;
    
    scene = new THREE.Scene();
    
    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0, 1 );
    scene.add( light );

    var geometry = new THREE.CubeGeometry( 20, 20, 20 );
    var material = new THREE.MeshLambertMaterial( {
        color: 0x4682B4, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
    
    // создаём контейнер для 3D гистограммы
    chart3d = new THREE.Object3D();
  chart3d.rotation.x = 0.6;
  scene.add( chart3d );
    
    // создаём функцию newBar() для D3
    newBar = function() { return new THREE.Mesh( geometry, material ); }

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize () {
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    
}

function animate () {
    
    requestAnimationFrame( animate );
    
    chart3d.rotation.y += 0.01;
    
    renderer.render( scene, camera );
    
}