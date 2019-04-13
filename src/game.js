	(function(self) {
		"use strict";
		function createElem(t,d) {
			var r = document.createElement(t), k = Object.keys(d || {});
			if(d instanceof Object) for(var i = 0; i < k.length; i++)
				r[k[i]] = d[k[i]];
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
			'map': [],
			'strings': {
				'en': {
					'start': 'press enter to play sigma-z',
					'dead': 'you died - refresh to replay'
				}
			},
			'lang': 'en',
			'noise': new SimplexNoise('American Tune'),
			'fpsCounter': {
				'lastUpd': new Date().getTime(),
				'fps': 0,
				'frames': 0
			},
			'frame': function() {
				this.fpsCounter.frames ++;
				var now = new Date().getTime();
				if(now > this.fpsCounter.lastUpd + 999) {
					this.fpsCounter.lastUpd = now;
					this.fpsCounter.fps = this.fpsCounter.frames;
					this.fpsCounter.frames = 0;
				}
				requestAnimationFrame(this.frame.bind(this));
				this.uiContext.clearRect(0, 0, this.width, this.height);
				this.context.fillStyle = '#000';
				this.context.fillRect(0, 0, this.width, this.height);
				this.drawMap(this.camera.x, this.camera.y);
				this.drawText(this.tsize, this.height - this.tsize * 2, 
							  this.fpsCounter.fps + ' fps - 0 coins - ' + (~~this.player.health) + ' health', 
							 false);
				if(this.player.health < 0)
					this.stage = 'dead';
				switch(this.stage) {
					case 'title':
						this.doPrompt(this.strings[this.lang].start);
						break;
					case 'dead':
						this.doPrompt(this.strings[this.lang].dead);
						break;
					case 'play':
						var camSpeed = [
							((this.player.x - this.width / 2) - this.camera.x) / 48,
							((this.player.y - this.height / 2) - this.camera.y) / 48
						];
						this.camera.x += camSpeed[0];
						this.camera.y += camSpeed[1];
						// Draw player & set speed
						var gridX = Math.min(Math.round(this.player.x / this.tsize), this.map.length - 1),
							gridY = Math.min(Math.round(this.player.y / this.tsize), this.map[gridX].length - 1),
							spd = 1;
						this.context.strokeStyle = 'rgba(0, 0, 0, 0.25)';
						this.context.lineWidth = 2;
						this.context.strokeRect(
											gridX * this.tsize - this.camera.x,
											gridY * this.tsize - this.camera.y,
											this.tsize, this.tsize
										);
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
						// Healing
						var hth = 1.05 - (this.player.health / this.player.maxHealth);
						switch(this.map[gridX][gridY][2]) {
							case '#A84':
								spd = 0.9;
								break;
							case '#039':
								spd = 0.6;
								this.player.health -= hth * 1.125;
								break;
						}
						this.player.health = Math.min(this.player.health + hth, this.player.maxHealth);
						// Move player
						if(keyboard.a)
							this.player.x -= spd * 3;
						if(keyboard.w)
							this.player.y -= spd * 3;
						if(keyboard.d)
							this.player.x += spd * 3;
						if(keyboard.s)
							this.player.y += spd * 3;
						this.player.y = Math.max(
							Math.min(
								this.height * (this.n - 1),
								this.player.y
							),
							0
						);
						this.player.x = Math.max(
							Math.min(
								this.width * (this.n - 1),
								this.player.x
							),
							0
						);
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
						break;
				}
			},
			'tsize': 32,
			'camera': { 'x': 0, 'y': 0 },
			'player': { 'x': 0, 'y': 0, 'health': 10, 'maxHealth': 10 },
			'n': 32,
			'font': createElem('img', { 'src': 'img/font.png' }),
			'start': function() {
				this.stage = 'play';
			},
			'colours': {
				'#060': 70,
				'#A84': 10,
				'#039': 20,
				'things': ['#060', '#A84', '#039']
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
					if(this.font.complete)
						this.uiContext.drawImage(this.font, tx, ty, 8, 8, x + minX, y + minY, txtSize, txtSize);
				}
			},
			'drawMap': function(pX, pY) {
				for(var x = ~~(pX / this.tsize); x < Math.ceil((pX + this.width) / this.tsize); x++) {
					for(var y = ~~(pY / this.tsize); y < Math.ceil((pY + this.height) / this.tsize); y++) {
						var t = this.map[x][y];
						this.context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
						this.context.strokeRect(t[0] - pX, t[1] - pY, this.tsize, this.tsize);
						this.context.fillStyle = t[2];
						this.context.fillRect(t[0] - pX, t[1] - pY, this.tsize, this.tsize);
					}
				}
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
					for(var y = 0; y < this.height; y += this.tsize / this.n)
						_.push([
							x * this.n, y * this.n,
							this.pick(this.colours, ~~(
								(this.noise.noise2D(
									x * this.n / 500,
									y * this.n / 500
								) + 1) * 50
							))
						]);
					this.map.push(_);
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
				case 39:
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
				case 39:
					keyboard['s'] = true;
					break;
				case 13:
				case 32:
					if(game.stage != 'play')
						game.start();
					else
						keyboard.projectile = true;
					break;
			}
		});
		self.addEventListener('DOMContentLoaded', function(e) {
			if(e.isTrusted)
				game.init();
		});
	})(this);
