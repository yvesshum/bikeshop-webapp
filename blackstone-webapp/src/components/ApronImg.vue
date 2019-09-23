<template>
	<div class="apron_img"
		@mouseover="mousehover(true)"
		@mouseleave="mousehover(false)"
		@click="mouseclick"
		v-b-tooltip.hover.html="showName ? name : ''"
	>
		<canvas ref="canvas"></canvas>
	</div>
</template>

<script>
import ApronImage from "@/assets/apron_image.png";
import ApronEmpty from "@/assets/apron_empty_lock.png";

export default {
	name: 'apron_img',

	props: {
		color:    { type: Number,  default: -1,   },
		name:     { type: String,  default: "",   },
		size:     { type: Number,  default: 64,   },
		active:   { type: Boolean, default: true, },
		showName: { type: Boolean, default: true, },
	},

	data: function() {
		return {
			// Image objects to hold the achieved an unachieved apron displays
			apron_image: new Image(),
			apron_empty: new Image(),

			// Boolean values to indicate whether the images have loaded yet
			apron_image_loaded: false,
			apron_empty_loaded: false,
		}
	},

	mounted: function() {
		// Load both images from assets
		this.apron_image.src = ApronImage;
		this.apron_empty.src = ApronEmpty;

		// When each image loads, update its respective boolean tracker
		this.apron_image.onload = () => { this.apron_image_loaded = true; };
		this.apron_empty.onload = () => { this.apron_empty_loaded = true; };

		// Manually set the size of the canvas (see note in Watcher function for size)
		let canvas = this.$refs.canvas;
		canvas.height = this.size;
		canvas.width  = this.size;
	},

	watch: {
		// Once both image assets are loaded, render the proper one
		loaded: function() {
			this.draw_image();
		},

		// When the active status changes, re-render the image
		active: function() {
			this.draw_image();
		},

		// If the color changes, re-render the image
		color: function() {
			this.draw_image();
		},

		// If the size changes, re-scale the canvas appropriately
		size: function() {

			// Change the canvas size manually
			// If we try to change it implicitly by passing this.size as a prop to the canvas, the apron image isn't redrawn properly (or at all, really)
			var canvas = this.$refs.canvas;
			canvas.height = this.size;
			canvas.width  = this.size;

			// Re-draw the current image to the canvas
			this.draw_image();
		},
	},

	computed: {
		// Tell whether both image assets are loaded or not
		loaded: function() {
			return this.apron_image_loaded && this.apron_empty_loaded;
		},

		// Return the apron image currently being used (the active one or the inactive one)
		current_image: function() {
			return (this.active ? this.apron_image : this.apron_empty);
		},
	},

	methods: {

		// Draw (or re-draw) the proper image to the canvas and color it appropriately
		draw_image: function() {

			// Get the context
			let ctx = this.$refs.canvas.getContext("2d");

			// Clear the previous image and draw the new one
			ctx.clearRect(0, 0, this.size, this.size);
			ctx.drawImage(this.current_image, 0, 0, this.size, this.size);

			// Recolor the new image
			this.recolor_apron(this.color);
		},


		// Recolor the grayscale apron image to match the color of the appropriate apron
		// Modified from http://jsfiddle.net/m1erickson/2d7ZN/
		recolor_apron: function(hue) {

			var apron = this.$refs.canvas;

			var ctx = apron.getContext("2d");
			var imgData = ctx.getImageData(0, 0, apron.width, apron.height);
			var data = imgData.data;

			if (hue != -1) {
				for (var i = 0; i < data.length; i += 4) {
					let red   = data[i + 0];
					let green = data[i + 1];
					let blue  = data[i + 2];
					let alpha = data[i + 3];

					// skip transparent/semitransparent pixels
					if (alpha < 200) {
						continue;
					}

					var hsl = this.rgbToHsl(red, green, blue);
					var newRgb;

					// Black
					if (hue == 361) {
						newRgb = this.hslToRgb(0, 0, hsl.l - .25);
					}

					// Colors
					else {
						newRgb = this.hslToRgb(hue / 360, 0.25, hsl.l);
					}
					data[i + 0] = newRgb.r;
					data[i + 1] = newRgb.g;
					data[i + 2] = newRgb.b;
				}
			}
			ctx.putImageData(imgData, 0, 0);
		},

		// Convert RGB color value to HSL (Hue, Saturation, Lightness)
		// Source: http://jsfiddle.net/m1erickson/2d7ZN/
		rgbToHsl: function(r, g, b) {
			r /= 255, g /= 255, b /= 255;
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if (max == min) {
				h = s = 0; // achromatic
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch (max) {
					case r:
						h = (g - b) / d + (g < b ? 6 : 0);
						break;
					case g:
						h = (b - r) / d + 2;
						break;
					case b:
						h = (r - g) / d + 4;
						break;
				}
				h /= 6;
			}

			return ({
				h: h,
				s: s,
				l: l,
			});
		},

		// Convert HSL (Hue, Saturation, Lightness) color value to RGB
		// Source: http://jsfiddle.net/m1erickson/2d7ZN/
		hslToRgb: function(h, s, l) {
			var r, g, b;

			if (s == 0) {
				r = g = b = l; // achromatic
			} else {
				function hue2rgb(p, q, t) {
					if (t < 0) t += 1;
					if (t > 1) t -= 1;
					if (t < 1 / 6) return p + (q - p) * 6 * t;
					if (t < 1 / 2) return q;
					if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
					return p;
				}

				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1 / 3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1 / 3);
			}

			return ({
				r: Math.round(r * 255),
				g: Math.round(g * 255),
				b: Math.round(b * 255),
			});
		},

		mousehover: function(val) {
			this.$emit('mousehover', val);
		},

		mouseclick: function() {
			this.$emit('click', this.active);
		},
	},
}
</script>