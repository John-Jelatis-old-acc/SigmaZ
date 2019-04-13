try{
var p = [], repeat = 255;
while(p.length < 512)
	p.push(p.length % 256);
p.sort(function(a,b) {
	return Math.random() - 0.5;
});
function fade(t) {
	return (6 * t ** 5) - (15 * t ** 4) + (10 * t ** 3);
}
function inc(n) {
	return (n+1) % repeat;
}
function grad(h, x, y, z) {
	var hh = h & 0xF,
		u = hh < 8 ? x : y;
	var v;
	if(hh < 0b0100)
		v = y;
	else if(hh == 0b1100 || hh == 0b1110)
		v = x;
	else
		v = z;
	return ((hh & 1) == 0 ? u : -u) + ((hh & 2) == 0 ? v : -v);
}
function lerp(a,b,x) {
	return a + x * (b - a);
}
function noise(x, y, z) {
	x = x % repeat;
	y = y % repeat;
	z = z % repeat;
	var xi = ~~x & 255,
		yi = ~~y & 255,
		zi = ~~z & 255;
	var xf = x - ~~x,
		yf = y - ~~y,
		zf = z - ~~z;
	var u = fade(xf),
		v = fade(yf),
		w = fade(zf);
	var aaa = p[p[p[xi]+yi]+zi],
		aba = p[p[p[xi]+inc(yi)]+zi],
		aab = p[p[p[xi]+yi]+inc(zi)],
		abb = p[p[p[xi]+inc(yi)]+inc(zi)],
		baa = p[p[p[inc(xi)]+yi]+zi],
		bba = p[p[p[inc(xi)]+inc(yi)]+zi],
		bab = p[p[p[inc(xi)]+yi]+inc(zi)],
		bbb = p[p[p[inc(xi)]+inc(yi)]+inc(zi)];
	var x1 = lerp(grad(aaa,xf,yf,zf),grad(baa,xf-1,yf,zf),u),
		x2 = lerp(grad(aba,xf,yf-1,zf),grad(bba,xf-1,yf-1,zf),u),
		y1 = lerp(x1, x2, v);
	x1 = lerp(grad(aab,xf,yf,zf-1),grad(bab,xf-1,yf,zf-1),u);
	x2 = lerp(grad(abb,xf,yf-1,zf-1),grad(bbb,xf-1,yf-1,zf-1),u);
	var y2 = lerp(x1, x2, v);
	return lerp(y1, y2, w);
}
alert(noise(4, 4, 4));
}catch(e){alert(e)}