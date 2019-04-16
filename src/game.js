(function(self) {
	'use strict';
	function createElem(t,d,w) {
		var r = document.createElement(t), k = Object.keys(d || {});
		if(d instanceof Object) for(var i = 0; i < k.length; i++)
			r[k[i]] = d[k[i]];
		if(w instanceof Object) {
			if('run' in w) {
				w.run(r);
			}
		}
		return r;
	}
	var keyboard = {
		'w': false,
		'a': false,
		's': false,
		'd': false
	}, game = {
		'stage': 'title',
		'context': createElem('canvas')
					.getContext('2d', { 'alpha': false, 'antialias': false }),
		'uiContext': createElem('canvas')
					.getContext('2d', { 'alpha': true, 'antialias': false }),
		'width': 720,
		'height': 540,
		'map': {
			'terrain': [],
			'coins': []
		},
		'strings': {
			'en': {
				'start': 'press enter to play sigma-z',
				'dead': 'you died - press enter to restart'
			}
		},
		'lang': 'en',
		'noise': new SimplexNoise(),
		'fpsCounter': {
			'fps': 0,
			'frames': 0
		}, 
		'tickCounter': {
			'tps': 0,
			'ticks': 0
		}, 
		'tsize': 32,
		'camera': { 'x': 0, 'y': 0 },
		'player': { 'x': 0, 'y': 0, 'health': 25, 'maxHealth': 25 },
		'coins': 0,
		'n': 32,
		'img': {
			'font': createElem('img', { 'src': 'img/font.png' }),
			'coin': createElem('img', { 'src': 'img/sigmacoin.png' }),
			'player': {}, // createElem('img', { 'src': 'img/player.png' }),
			'#039': createElem('canvas', { 'width': 32, 'height': 32 }, { 'run': function(e) {
				var i = createElem('img', { 'src': 'img/terrain.png' }),
					c = e.getContext('2d', { 'antialias': false, 'alpha': false });
				c.imageSmoothingEnabled = false;
				i.onload = function() {
					c.drawImage(i, 24, 8, 8, 8, 0, 0, e.width, e.height);
				};
			} }),
			'#060': createElem('canvas', { 'width': 32, 'height': 32 }, { 'run': function(e) {
				var i = createElem('img', { 'src': 'img/terrain.png' }),
					c = e.getContext('2d', { 'antialias': false, 'alpha': false });
				c.imageSmoothingEnabled = false;
				i.onload = function() {
					c.drawImage(i, 16, 0, 8, 8, 0, 0, e.width, e.height);
				};
			} }),
			'#A84': createElem('canvas', { 'width': 32, 'height': 32 }, { 'run': function(e) {
				var i = createElem('img', { 'src': 'img/terrain.png' }),
					c = e.getContext('2d', { 'antialias': false, 'alpha': false });
				c.imageSmoothingEnabled = false;
				i.onload = function() {
					c.drawImage(i, 24, 0, 8, 8, 0, 0, e.width, e.height);
				};
			} }),
		},
		'colours': {
			'#060': 70,
			'#A84': 10,
			'#039': 20,
			'things': ['#060', '#A84', '#039']
		},
		'sfx': {
			'btnHover': createElem('audio', { 'src': 'sfx/btn-hover.wav', 'volume': 0.1 }),
			'btnPress': createElem('audio', { 'src': 'sfx/btn-press.wav', 'volume': 0.1 }),
			'step': [
				createElem('audio', { 'src': 'sfx/step.wav', 'volume': 1.0 }),
				createElem('audio', { 'src': 'sfx/step.wav', 'volume': 1.0 })
			],
			'coin': [
				createElem('audio', { 'src': 'sfx/coin.wav', 'volume': 0.2 }),
				createElem('audio', { 'src': 'sfx/coin.wav', 'volume': 0.2 }),
				createElem('audio', { 'src': 'sfx/coin.wav', 'volume': 0.2 }),
				createElem('audio', { 'src': 'sfx/coin.wav', 'volume': 0.2 })
			]
		},
		'last': {
			'fpsCounter': 0,
			'step': 0,
			'tick': 0,
			'tickCounter': 0,
		},
		'steps': 0,
		'frame': function() {
			var now = new Date().getTime();
			if(now > this.last.fpsCounter + 999) {
				this.last.fpsCounter = now;
				this.fpsCounter.fps = this.fpsCounter.frames;
				this.fpsCounter.frames = 0;
			}
			this.fpsCounter.frames ++;
			requestAnimationFrame(this.frame.bind(this));
			this.uiContext.clearRect(0, 0, this.width, this.height);
			this.context.clearRect(0, 0, this.width, this.height);
			this.context.fillStyle = '#000';
			this.context.fillRect(0, 0, this.width, this.height);
			this.drawMap(this.camera.x, this.camera.y);
			this.drawText(this.tsize, this.height - this.tsize * 2, 
						 	this.fpsCounter.fps + ' fps (' + this.tickCounter.tps + ' tps) - ' + 
						 	this.coins + ' coins - ' + (~~this.player.health) + ' health', 
						 false);
			if(this.player.health <= 0)
				this.stage = 'dead';
			switch(this.stage) {
				case 'title':
					document.documentElement.classList.add('paused');
					this.doPrompt(this.strings[this.lang].start);
					break;
				case 'dead':
					document.documentElement.classList.add('paused');
					this.doPrompt(this.strings[this.lang].dead);
					break;
				case 'play':
					document.documentElement.classList.remove('paused');
					if(!document.hasFocus())
						this.stage = 'title';
					// Draw player & set speed
					var gridX = Math.max(
						Math.min(
							Math.round(
								this.player.x / this.tsize
							),
							this.map.terrain.length - 1
						), 0
					),	gridY = Math.max(
						Math.min(
							Math.round(
								this.player.y / this.tsize
							),
							this.map.terrain[gridX].length - 1
						), 0
					);
					this.context.lineWidth = 2;
					this.context.strokeStyle = 'rgba(0, 0, 0, 0.25)';
					this.context.strokeRect(
										gridX * this.tsize - this.camera.x,
										gridY * this.tsize - this.camera.y,
										this.tsize, this.tsize
									);
					this.update(gridX, gridY);
					if(this.img.player.complete) {
						var facing = 1;
						if(keyboard.w)
							facing = 0;
						if(keyboard.s)
							facing = 1;
						if(keyboard.a)
							facing = 2;
						if(keyboard.d)
							facing = 3;
						this.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
						this.context.fillRect(
											this.player.x - this.camera.x + this.tsize * 0.25,
											this.player.y - this.camera.y + this.tsize * 0.25,
											this.tsize * 0.5, this.tsize * 1
										);
						this.uiContext.drawImage(this.img.player, 0, facing * 24, 24, 24,
											this.player.x - this.camera.x - this.tsize * 0.125,
											this.player.y - this.camera.y - this.tsize * 0.125,
											this.tsize * 1.5, this.tsize * 1.5
										);
												 
					} else {
						this.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
						this.context.fillRect(
											this.player.x - this.camera.x + this.tsize * 0.125,
											this.player.y - this.camera.y + this.tsize * 0.125,
											this.tsize * 0.75, this.tsize * 0.75
										);
						this.uiContext.fillStyle = '#09F';
						this.uiContext.fillRect(
											this.player.x - this.camera.x + this.tsize * 0.125,
											this.player.y - this.camera.y + this.tsize * 0.125,
											this.tsize * 0.75, this.tsize * 0.75
										);
					}
					break;
			}
		},
		'update': function(gridX, gridY) {
			var now = new Date().getTime(),
				ticks = Math.round((now - (this.last.tick || now)) / (20));
			var spd = 1;
			this.last.tick = now;
			this.tickCounter.ticks += ticks;
			if(this.last.tickCounter < now - 999) {
				this.last.tickCounter = now;
				this.tickCounter.tps = this.tickCounter.ticks;
				this.tickCounter.ticks = 0;
			}
			for(var i = 0; i < ticks; i++) {
				// Get coins
				for(var c in this.map.coins) {
					var coin = this.map.coins[c];
					if(Math.pow(coin[0] - this.player.x, 2) + Math.pow(coin[1] - this.player.y, 2) < this.tsize * this.tsize) {
						this.coins += coin[2];
						this.player.health += coin[2];
						this.sfx.coin[~~(this.coins % this.sfx.coin.length)].play();
						this.map.coins.splice(c, 1);
						break;
					}
				};
				// Healing
				var hth = 0.8;
				switch(this.map.terrain[gridX][gridY][2]) {
					case '#A84':
						spd = 0.9;
						break;
					case '#039':
						spd = 0.6;
						this.player.health -= hth * 0.125;
						break;
				}
				this.player.health = Math.min(this.player.health, this.player.maxHealth);
				// Move player
				if(keyboard.a)
					this.player.x -= spd * 3;
				if(keyboard.w)
					this.player.y -= spd * 3;
				if(keyboard.d)
					this.player.x += spd * 3;
				if(keyboard.s)
					this.player.y += spd * 3;
				if((Math.round(this.player.x / this.tsize) != gridX
				 || Math.round(this.player.y / this.tsize) != gridY)
				 && new Date().getTime() > this.last.step + 150) {
					this.sfx.step[++this.steps%2].play();
					this.last.step = new Date().getTime();
				}
				this.player.y = Math.max(
					Math.min(
						this.height * (this.n) - this.tsize,
						this.player.y
					),
					0
				);
				this.player.x = Math.max(
					Math.min(
						this.width * (this.n) - this.tsize,
						this.player.x
					),
					0
				);
				var camSpeed = [
					((this.player.x - this.width / 2) - this.camera.x) / 48,
					((this.player.y - this.height / 2) - this.camera.y) / 48
				];
				this.camera.x += camSpeed[0];
				this.camera.y += camSpeed[1];
				this.camera.y = Math.max(
					Math.min(
						this.height * (this.n - 1),
						this.camera.y
					),
					0
				);
				this.camera.x = Math.max(
					Math.min(
						this.width * (this.n - 1),
						this.camera.x
					),
					0
				);
			}
		},
		'start': function() {
			this.sfx.btnPress.play();
			this.stage = 'play';
		},
		'doPrompt': function(text) {
			var minX = this.tsize * 1.5,
				minY = this.tsize * 1.5;
			this.uiContext.lineWidth = 2;
			this.uiContext.strokeStyle = '#000';
			this.uiContext.strokeRect(minX, minY,
								  this.width - this.tsize * 3, this.tsize * 2);
			this.uiContext.fillStyle = '#666';
			this.uiContext.fillRect(minX, minY,
								  this.width - this.tsize * 3, this.tsize * 2);
			this.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
			this.context.fillRect(minX, minY,
								  this.width - this.tsize * 3, this.tsize * 2);
			var sw = Math.sin(new Date().getTime() / 500) * 2;
			this.drawText(minX + sw / 2 + 6, minY + 16 + sw, text, true);
		},
		'drawText': function(minX, minY, text, centre, maxX, maxY) {
			var strLen = text.length,
				txtSize = 16;
			if(centre)
				minX += (this.width - strLen*txtSize) / 4;
			for(var i = 0; i < text.length; i++) {
				var maxX = ~~(maxX || ((this.width - this.tsize * 3) / 10)),
					maxY = ~~(maxY || ((this.tsize) / 2));
				var x = ~~(i % maxX) * txtSize, y = ~~(i / maxX) * txtSize;
				var ti = {
					'a': [ 0, 0], 'b': [ 8, 0],
					'c': [16, 0], 'd': [24, 0],
					'e': [32, 0], 'f': [40, 0],
					'g': [48, 0], 'h': [56, 0],
					'i': [64, 0], 'j': [72, 0],
					'k': [80, 0], 'l': [88, 0],
					'm': [ 0, 8], 'n': [ 8, 8],
					'o': [16, 8], 'p': [24, 8],
					'q': [32, 8], 'r': [40, 8],
					's': [48, 8], 't': [56, 8],
					'u': [64, 8], 'v': [72, 8],
					'w': [80, 8], 'x': [88, 8],
					'y': [0, 16], 'z': [8, 16],
					' ': [88, 24], '-': [40, 24],
					'?': [16, 16], '1': [24, 16],
					'2': [32, 16], '3': [40, 16],
					'4': [48, 16], '5': [56, 16],
					'6': [64, 16], '7': [72, 16],
					'8': [80, 16], '9': [88, 16],
					'0': [ 0, 24], '/': [ 8, 24],
					'!': [16, 24], '(': [24, 24],
					')': [32, 24]
				};
				var tx = ti[text.charAt(i)][0],
					ty = ti[text.charAt(i)][1];
				if(this.img.font.complete)
					this.uiContext.drawImage(this.img.font, tx, ty, 8, 8, x + minX, y + minY, txtSize, txtSize);
			}
		},
		'drawMap': function(pX, pY) {
			var self = this;
			for(var x = ~~(pX / this.tsize); x < Math.ceil((pX + this.width) / this.tsize); x++) {
				for(var y = ~~(pY / this.tsize); y < Math.ceil((pY + this.height) / this.tsize); y++) {
					var t = this.map.terrain[x][y];
					this.context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
					this.context.strokeRect(t[0] - pX, t[1] - pY, this.tsize, this.tsize);
					if(t[2] in this.img) {
						this.context.drawImage(this.img[t[2]], t[0] - pX, t[1] - pY, this.tsize, this.tsize);
					} else {
						this.context.fillStyle = t[2];
						this.context.fillRect(t[0] - pX, t[1] - pY, this.tsize, this.tsize);
					}
				}
			}
			this.map.coins.forEach(function(t) {
				if(t[0] < ~~(pX / 1) || t[0] > Math.ceil((pX + self.width) / 1)
				|| t[1] < ~~(pY / 1) || t[1] > Math.ceil((pY + self.height)/ 1))
					return;
				self.context.fillStyle = 'rgba(0, 0, 0, 0.1)';
				self.context.fillRect(t[0] - pX + self.tsize / 3, t[1] - pY + self.tsize / 3, self.tsize / 3, self.tsize / 3);
				
				var f = ~~(new Date().getTime() / 150) % (self.img.coin.height / 16);
				if(self.img.coin.complete) {
					self.uiContext.drawImage(self.img.coin, 0, Math.abs(f * 16), 16, 16, 
										 t[0] - pX + self.tsize / 4, t[1] - pY + self.tsize / 4, self.tsize / 2, self.tsize / 2);
				} else {
					self.uiContext.fillStyle = '#CB0';
					self.uiContext.fillRect(t[0] - pX + self.tsize / 3, t[1] - pY + self.tsize / 3, self.tsize / 3, self.tsize / 3);
				}
				
			});
		},
		'pick': function(arr, val) {
			var r = arr.things,
				l = [], i;
			for(i = 0; i < r.length; i++) {
				l.push(arr[r[i]]);
			}
			var v = 0;
			for(i = 0; i < l.length; i++) {
				v += l[i];
				if(v > val)
					return r[i];
			}
			return arr[arr.length-1];
		},
		'init': function() {
			// Set canvas size
			this.context.canvas.width = this.width;
			this.context.canvas.height = this.height;
			this.uiContext.canvas.width = this.width;
			this.uiContext.canvas.height = this.height;
			// Set ID
			this.context.canvas.id = 'game';
			this.uiContext.canvas.id = 'ui';
			// Append to body
			document.body.appendChild(this.context.canvas);
			document.body.appendChild(this.uiContext.canvas);
			// Gen map
			for(var x = 0; x < this.width; x += this.tsize / this.n) {
				var _ = [];
				for(var y = 0; y < this.height; y += this.tsize / this.n) {
					var noise = this.noise.noise2D(
						x * this.n / 500,
						y * this.n / 500
					);
					_.push([
						x * this.n, y * this.n,
						this.pick(this.colours, ~~(
							(noise + 1) * 50
						))
					]);
				}
				this.map.terrain.push(_);
			}
			for(var x = 0; x < this.map.terrain.length; x ++) {
				for(var y = 0; y < this.map.terrain[x].length; y ++) {
					var noise = this.noise.noise2D(
						x * this.tsize / 500,
						y * this.tsize / 500
					);
					if(noise < -0.7) {
						this.map.coins.push([x * this.tsize, y * this.tsize, 1]);
					}
				}
			}
			// More setup crap
			this.context.imageSmoothingEnabled = false;
			this.uiContext.imageSmoothingEnabled = false;
			// and do frames
			this.frame();
		}
	};

	self.document.title = 'Sigma-Z';

	self.addEventListener('error', function(err) {
		alert(err.error + '\n\t' + err.lineno + ':' + err.colno);
	});

	self.addEventListener('keyup', function(e) {
		if(!e.ctrlKey && !e.metaKey)
			e.preventDefault();
		switch(e.keyCode || e.charCode || e.which) {
			case 65:
			case 37:
				keyboard['a'] = false;
				break;
			case 68:
			case 39:
				keyboard['d'] = false;
				break;
			case 87:
			case 38:
				keyboard['w'] = false;
				break;
			case 83:
			case 40:
				keyboard['s'] = false;
				break;
		}
	});
	self.addEventListener('keydown', function(e) {
		if(!e.ctrlKey && !e.metaKey)
			e.preventDefault();
		switch(e.keyCode || e.charCode || e.which) {
			case 65:
			case 37:
				keyboard['a'] = true;
				break;
			case 68:
			case 39:
				keyboard['d'] = true;
				break;
			case 87:
			case 38:
				keyboard['w'] = true;
				break;
			case 83:
			case 40:
				keyboard['s'] = true;
				break;
			case 13:
			case 32:
				switch(game.stage) {
					case 'title': 
						game.start();
						break;
					case 'dead':
						self.document.location.reload();
						break;
					case 'play':
						keyboard.projectile = true;
					break;
				}
		}
	});
	self.addEventListener('DOMContentLoaded', function(e) {
		if(e.isTrusted)
			game.init();
	});
})(this);