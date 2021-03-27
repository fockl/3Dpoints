//https://ics.media/tutorial-three/quickstart/

// ページの読み込みを待つ
window.addEventListener('load', init);

let scene, renderer, camera, controls;
let arrow_visibility = false;
let positions = [];
let ave_pos = [];

//{{{initRequestAnimationFrame
function initRequestAnimationFrame(){
  // http://www.inazumatv.com/contents/archives/7438
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x=0; x<vendors.length && !window.requestAnimationFrame; ++x){
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = 
    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if(!window.requestAnimationFrame){
    window.requestAnimationFrame = function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
  }
  if(!window.cancelAnimationFrame){
    window.cancelAnimationFrame = function(id){
     clearTimeout(id);
    }
  }
}
//}}}

//{{{ init
function init() {
  // サイズを指定
  const width = 960;
  const height = 540;
  // レンダラーを作成
  renderer = new THREE.WebGLRenderer({
          canvas: document.querySelector('canvas')
        });
  renderer.setClearColor(0xffffff);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // シーンを作成
  scene = new THREE.Scene();

  // カメラを作成
  camera = new THREE.PerspectiveCamera(45, width / height);
  camera.position.set(1, 1, 1);

  controls = new THREE.TrackballControls(camera, document.querySelector('canvas'));
  controls.update();

  const axis = new THREE.AxesHelper(200);
  axis.position.set(0,0,0);
  scene.add(axis);

  initRequestAnimationFrame();
  tick();
}
//}}}

//{{{ tick
// 毎フレーム時に実行されるループイベントです
function tick(){
  renderer.render(scene, camera); // レンダリング
  //http://gupuru.hatenablog.jp/entry/2013/12/14/201308
  controls.update();
  requestAnimationFrame(tick);
}
//}}}

//{{{ apply
function apply(flag){
  clear(false);

  if(flag==true){
    let x = Number(document.getElementById("vertex-append-x").value);
    let y = Number(document.getElementById("vertex-append-y").value);
    let z = Number(document.getElementById("vertex-append-z").value);
    positions.push([x, y, z]);
  }

  let position_array = new Float32Array(positions.length*3);
  let vertex_index_array = new Uint32Array(positions.length);
  let color_array = new Float32Array(positions.length*3);
  const color = new THREE.Color(0x00CCCC);
  for(let i=0; i<positions.length; ++i){
    position_array[3*i+0] = positions[i][0];
    position_array[3*i+1] = positions[i][1];
    position_array[3*i+2] = positions[i][2];
    color_array[3*i+0] = color.r;
    color_array[3*i+1] = color.g;
    color_array[3*i+2] = color.b;

    vertex_index_array[i] = i;
  }

  let vertex_geometry = new THREE.BufferGeometry();
  vertex_geometry.setIndex(new THREE.Uint32BufferAttribute(vertex_index_array, 1).onUpload(() => {this.array = null;}));
  vertex_geometry.setAttribute('position', new THREE.Float32BufferAttribute(position_array, 3).onUpload(() => {this.array = null}));
  vertex_geometry.setAttribute('color', new THREE.Float32BufferAttribute(color_array, 3).onUpload(() => {this.array = null;}));
  vertex_geometry.computeVertexNormals();
  vertex_geometry.computeBoundingBox();
  vertex_geometry.elementsNeedUpdate = true;
  vertex_geometry.colorsNeedUpdate = true;

  let vertex_material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: THREE.VertexColors,
  });

  let vertices = new THREE.Points(vertex_geometry, vertex_material);
  vertices.name = "vertices";
  scene.add(vertices);

  if(arrow_visibility == true){
    //https://qiita.com/7of9/items/790f3336cba076b9a245
    for(let i=0; i<positions.length-1; ++i){
      let from = new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]);
      let to = new THREE.Vector3(positions[i+1][0], positions[i+1][1], positions[i+1][2]);
      let dir = to.clone().sub(from);
      let len = dir.length();
      let arrow = new THREE.ArrowHelper(dir.normalize(), from, len, 0x000000);
      arrow.name = "arrow-" + i;
      scene.add(arrow);
    }
  }

  return;
}
//}}}

//{{{ clear
function clear(flag){
  let obj = scene.getObjectByName("vertices");
  console.log(obj);
  if(obj != undefined){
    scene.remove(obj);
  }
  let i = 0;
  while(true){
    let obj = scene.getObjectByName("arrow-" + i);
    if(obj != undefined){
      scene.remove(obj);
    }else{
      break;
    }
  }

  if(flag==true){
    positions = [];
    shift();
  }

  console.log(scene);

  return;
}
//}}}

//{{{ shift
function shift(){
  let avex = 0.0, avey = 0.0, avez = 0.0;
  let max_len = 1.0;
  for(let i=0; i<positions.length; ++i){
    avex += positions[i][0]/positions.length;
    avey += positions[i][1]/positions.length;
    avez += positions[i][2]/positions.length;
  }
  for(let i=0; i<positions.length; ++i){
    let tmp = 0;
    tmp += (positions[i][0]-avex)*(positions[i][0]-avex);
    tmp += (positions[i][1]-avey)*(positions[i][1]-avey);
    tmp += (positions[i][2]-avez)*(positions[i][2]-avez);
    if(max_len < tmp){
      max_len = tmp;
    }
  }
  controls.target.x = avex;
  controls.target.y = avey;
  controls.target.z = avez;
  camera.position.x = avex + max_len;
  camera.position.y = avey + max_len;
  camera.position.z = avez + max_len;
  camera.up.x = 0;
  camera.up.y = 1;
  camera.up.z = 0;
  controls.update();
  return;
}
//}}}

document.getElementById("vertex-append-button").addEventListener('click', () => {
  apply(true);
});

document.getElementById("vertex-clear-button").addEventListener('click', () => {
  clear(true);
});

document.getElementById("camera-shift-button").addEventListener('click', () => {
  shift();
});

document.getElementById("show-arrow-button").addEventListener('click', () => {
  arrow_visibility = !arrow_visibility;
  if(arrow_visibility){
    document.getElementById("show-arrow-button").innerHTML = "HIDE ARROW";
  }else{
    document.getElementById("show-arrow-button").innerHTML = "SHOW ARROW";
  }
  apply(false);
});
