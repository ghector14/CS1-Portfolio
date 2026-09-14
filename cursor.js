const m3 = {
  projection: function(width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },
  identity: function() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },
  translation: function(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },
  rotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },
  scaling: function(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },
  multiply: function(a, b) {
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },
  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },
  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },
};
class Emitter {
	// rate, min-r, max-r, min-life, max-life, min-size, max-size
	constructor(x, y, data) {
		this.lastX = this.x = x;
		this.lastY = this.y = y;
		this.vx = 0;
		this.vy = 0;
		
		data = data || {};
		for(const [key, defaultdata] of Object.entries(this.defaultdata)) {
			this[key] = data[key] == undefined ? defaultdata:data[key];
		}
	}
  active = true;
  life = 0;
  timeout = 10;
  start(time) {
    if(time) {
      this.time = 10;
    }
    this.active = true;
  }
	defaultdata = {
		count: 40,
		rate: 0.5,
 
		vmin: 2,
		vmax: 4,
 
		sizemax: 10,
		sizemin: 1,
 
		lifemin: 50,
		lifemax: 200,
		
		resistance: 0.1,
		gravity: 1,
		
		inherit: 0.2,
		relative: false,
		independent: false,
		type: "circle", 
		color: "rgb(0, 0, 0)"
	}
	particles = [];
	animate() {
		color(this.color);
		for(const particle of this.particles) {
			particle.animate(this.relative ? this.x:0, this.relative ? this.y:0);
		}
	}
	update() {
		if(this.independent) {
			this.lastX = this.x;
			this.lastY = this.y;
			this.x += this.vx;
			this.y += this.vy;
		} else {
			this.vx = this.x-this.lastX;
			this.vy = this.y-this.lastY;
			this.lastX = this.x;
			this.lastY = this.y;
		}
		if(this.active) {
      for(let i = 1; i <= this.count; i++) {
        if(Math.random() < this.rate) {
          const theta = Math.random()*Math.PI*2;
          const m = Math.random()*(this.vmax-this.vmin)+this.vmin;
          const life = Math.random()*(this.lifemax-this.lifemin)+this.lifemin;
          const size = Math.random()*(this.sizemax-this.sizemin)+this.sizemin;
          const x = this.lastX+this.vx*i/this.count;
          const y = this.lastY+this.vy*i/this.count;
          this.particles.push(new Particle(theta, m, life, size, this.relative, x, y, this.vx*this.inherit, this.vy*this.inherit, this.type));
        }
      }
    }
		const em = this;
		this.particles = this.particles.filter(function(particle) {
			return !particle.update(em);
		});
	}
}
class Particle {
	constructor(theta, m, lifetime, size, relative, x,y, vx,vy, type) {
		this.x = relative ? 0 : x;
		this.y = relative ? 0 : y;
		this.size = size;
		this.type = type;
		this.vx = Math.cos(theta)*m;
		this.vy = Math.sin(theta)*m;
		this.start = this.lifetime = lifetime;
		
		this.vy += vy;
		this.vx += vx;
	}
	static types = {
		fillRect(x, y, size) {
			square(x, y, size);
		},
		circle(x, y, size, life) {
			circle(x, y, size/2);
		},
    spincircle(x, y, size, life) {
			circle(x, y, size/2, life/120*Math.PI*2);
		},
		bubble(x, y, size) {
			ctx.beginPath();
			ctx.arc(x, y, Math.round(size/2), 0, Math.PI*2);
			ctx.stroke();
		}
	}
	animate(x, y) {
		const size = Math.round(this.lifetime/this.start*this.size);
		Particle.types[this.type](this.x+x, this.y+y, size, this.lifetime);
	}
	update(emitter) {
		this.x += this.vx;
		this.y += this.vy;
		this.vy += emitter.gravity;
		this.vx *= 1-emitter.resistance;
		this.vy *= 1-emitter.resistance;
		this.lifetime--;
		
		return this.lifetime <= 0;
	}
}
 
"use strict";
 
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
 
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}
 
const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");
const dpi = window.devicePixelRatio;
 
const detail = 5;
function initCircle() {
  //init circle
  const outer = [];
  for(let i = 0; i < detail; i++) {
    const index = i*2;
    outer.push(Math.cos(i/detail*Math.PI*2), Math.sin(i/detail*Math.PI*2));
  }
  const vertices = [];
  for(let i = 0; i < detail; i++) {
    const index = i*2;
    const back = ((i+detail-1)%detail)*2;
    vertices.push(outer[index], outer[index+1], 0, 0, outer[back], outer[back+1]);
  }
  
  //init buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const bufferArray = new Float32Array(vertices);
  gl.bufferData(gl.ARRAY_BUFFER, bufferArray, gl.STATIC_DRAW);
  return positionBuffer;
}
const circleBuffer = initCircle();
 
function initSquare() {
  //init buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const bufferArray = new Float32Array([
    0, 0,
    0.5, 0,
    0, 0.5,
    0.5, 0.5,
    0, 0.5,
    0.5, 0
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, bufferArray, gl.STATIC_DRAW);
  return positionBuffer;
}
const squareBuffer = initSquare();
 
//init program
const vertexShaderSource = `
attribute vec3 a_position;
uniform mat3 u_matrix;
 
void main() {
	gl_Position = vec4(u_matrix*vec3(a_position.xy, 1.0), 1.0);
}
`;
const fragmentShaderSource = `
precision highp float;
 
uniform vec4 u_color;
 
void main() {
  gl_FragColor = u_color;
}
`;
 
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
 
const program = createProgram(gl, vertexShader, fragmentShader);
 
const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
 
function color(color) {
  gl.uniform4fv(colorUniformLocation, new Float32Array(color));
}
function circle(x, y, r, rot = 0) {
  
  let matrix = m3.projection(canvas.width, canvas.height);
  matrix = m3.translate(matrix, x, y);
  matrix = m3.scale(matrix, r, r);
  matrix = m3.rotate(matrix, rot);
  
  gl.uniformMatrix3fv(matrixUniformLocation, false, matrix) 
  
  {
    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  }
  {
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = detail*3;
    gl.drawArrays(primitiveType, offset, count);
  }
}
function square(x, y, s) {
  let matrix = m3.projection(canvas.width, canvas.height);
  matrix = m3.translate(matrix, x, y);
  matrix = m3.scale(matrix, s, s);
  
  gl.uniformMatrix3fv(matrixUniformLocation, false, matrix) 
  
  {
    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  }
  {
    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}
 
//other initiation
const red = new Emitter(innerWidth/2*dpi, innerHeight/2*dpi , {
	gravity: -0.2,
	lifemax: 50,
	color: [1, 0, 50/255, 1],
	inherit: 0.01,
  rate: 0.2,
	vmax: 8,
  sizemax: 30,
  sizemin: 3,
  type: "circle"
});
const smoke = new Emitter(innerWidth/2*dpi, innerHeight/2*dpi , {
	gravity: -0.2,
  rate: 0.06,
	vmax: 7,
	lifemax: 300,
	lifemin: 100,
	color: [30/255, 30/255, 50/255, 1],
	inherit: 0.01,
  sizemax: 40,
  sizemin: 4,
  type: "circle"
});
const shadow = new Emitter(innerWidth/2*dpi, innerHeight/2*dpi , {
	gravity: -0.2,
  rate: 0.1,
	vmax: 7,
	lifemax: 300,
	lifemin: 100,
	color: [15/255, 15/255, 25/255, 1],
	inherit: 0.01,
  sizemax: 40,
  sizemin: 4,
  type: "circle"
});
const yellow = new Emitter(innerWidth/2*dpi, innerHeight/2*dpi , {
	gravity: -0.2,
	color: [255/255, 255/255, 50/255, 1],
	lifemax: 10,
	rate: 0.05,
	vmax: 7,
	inherit: 0.01,
  sizemax: 30,
  sizemin: 3,
  type: "circle"
});
const layers = [shadow, smoke, red, yellow];
 
addEventListener("mousemove", function(e) {
	for(const em of layers) {
		em.x = e.clientX*dpi;
		em.y = e.clientY*dpi;
	}
});
 
function animate(time) {
  
	//fix canvas
	canvas.width = canvas.clientWidth*dpi;
	canvas.height = canvas.clientHeight*dpi;
	
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  gl.useProgram(program);
  
  gl.enableVertexAttribArray(positionAttributeLocation);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
  
  for(const em of layers) {
		em.animate();
		em.update();
	}
  
  requestAnimationFrame(animate);
}
 
//start render loop
requestAnimationFrame(animate);
 