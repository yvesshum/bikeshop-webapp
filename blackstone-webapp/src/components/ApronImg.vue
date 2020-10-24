<template>
	<div class="apron_img"
		@mouseover="mousehover(true)"
		@mouseleave="mousehover(false)"
		@click="mouseclick"
		v-b-tooltip.hover.html="popup_msg"
	>
		<canvas ref="canvas"></canvas>
	</div>
</template>

<script>
import ApronImage from "@/assets/apron_image.png";
import ApronEmpty from "@/assets/apron_empty_lock.png";
import ApronCheck from "@/assets/apron_checked.png";
import ApronBlank from "@/assets/apron_outline.png";

export default {
	name: 'apron_img',

	props: {
		color:    { type: String,  default: "none",   },
		name:     { type: String,  default: "",   },
		size:     { type: Number,  default: 64,   },
		status:   {
			type: String,
			validator: (str) => {
				return ["achieved", "working", "locked", "progress"].includes(str);
			},
			default: "working",
		},
		showName: { type: Boolean, default: true, },
		showStatus: { type: Boolean, default: true, },
		progress: {type: Number, default: 100},
		total:    {type: Number, default: 100},
	},

	data: function() {
		return {
			// Image objects to hold the achieved an unachieved apron displays
			apron_image: new Image(),
			apron_empty: new Image(),
			apron_check: new Image(),
			apron_blank: new Image(),

			// Boolean values to indicate whether the images have loaded yet
			apron_image_loaded: false,
			apron_empty_loaded: false,
			apron_check_loaded: false,
			apron_blank_loaded: false,
		}
	},

	mounted: function() {
		// Load both images from assets
		this.apron_image.src = ApronImage;
		this.apron_empty.src = ApronEmpty;
		this.apron_check.src = ApronCheck;
		this.apron_blank.src = ApronBlank;

		// When each image loads, update its respective boolean tracker
		this.apron_image.onload = () => { this.apron_image_loaded = true; };
		this.apron_empty.onload = () => { this.apron_empty_loaded = true; };
		this.apron_check.onload = () => { this.apron_check_loaded = true; };
		this.apron_blank.onload = () => { this.apron_blank_loaded = true; };

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

		// When the status changes, re-render the image
		status: function() {
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

		progress: function() {
			this.draw_image();
		},

		total: function() {
			this.draw_image();
		},
	},

	computed: {
		// Tell whether both image assets are loaded or not
		loaded: function() {
			return this.apron_image_loaded && this.apron_empty_loaded && this.apron_check_loaded && this.apron_blank_loaded;
		},

		// Return the apron image currently being used (the active one or the inactive one)
		current_image: function() {
			switch (this.status) {
				case "achieved":
					return this.apron_check;

				case "locked":
					return this.apron_empty;

				case "working":
				default:
					return this.apron_image;
			}
		},

		popup_msg: function() {
			if (this.showName && this.name.length > 0) {
				let msg = `${this.name} Apron`;
				if (this.showStatus) {
					msg += `<br />(${this.status.charAt(0).toUpperCase()}${this.status.slice(1)})`;
				}
				return msg;
			}
			return '';
		},
	},

	methods: {

		// Draw (or re-draw) the proper image to the canvas and color it appropriately
		draw_image: function() {

			// Get the context
			let ctx = this.$refs.canvas.getContext("2d");

			// Clear the previous image and draw the new one
			ctx.clearRect(0, 0, this.size, this.size);

			if (this.status == "progress") {
				let img_size = 64;
				let percent = this.progress / this.total;
				ctx.drawImage(this.current_image,
					0, img_size  * (1 - percent), img_size,  img_size  * percent,
					0, this.size * (1 - percent), this.size, this.size * percent
				);
				ctx.drawImage(this.apron_blank,
					0, 0, img_size,  img_size  * (1 - percent),
					0, 0, this.size, this.size * (1 - percent)
				);
			}

			else {
				ctx.drawImage(this.current_image, 0, 0, this.size, this.size);
			}
			

			// Recolor the new image
			this.recolor_apron(this.color);
		},
		
		
		parse_hex_to_rgb : function(hue){
			if(hue.length == 7){
				if(hue[0] == '#'){
					let r = hue.slice(1, 3);
					let g = hue.slice(3, 5);
					let b = hue.slice(5, 7);
					let hex_re = /[0-9A-Fa-f]/;
					if(hex_re.test(r) && hex_re.test(g) && hex_re.test(b)){
						return {r : parseInt(r, 16),
							g : parseInt(g, 16),
							b : parseInt(b, 16) };
					}
				}
			}
			return "None";
		},


		// Recolor the grayscale apron image to match the color of the appropriate apron
		// Modified from http://jsfiddle.net/m1erickson/2d7ZN/
		// Takes the target color as a hex value
		recolor_apron: function(target_hex) {

			// Set up the canvas image stuff
			var apron = this.$refs.canvas;
			var ctx = apron.getContext("2d");
			var imgData = ctx.getImageData(0, 0, apron.width, apron.height);
			var data = imgData.data;
			
			// Get the target color in rgb format
			let target_rgb = this.parse_hex_to_rgb(target_hex)
			if (target_rgb != "None") {

				// Get the target color in HSL format
				let target_hsl = this.rgbToHsl(target_rgb.r, target_rgb.g, target_rgb.b);

				// Shift each pixel in the image
				for (var i = 0; i < data.length; i += 4) {

					// Skip transparent pixels - no point in doing the math for them
					if (data[i+3] == 0) continue;

					// Convert to HSL format
					var hsl = this.rgbToHsl(data[i], data[i+1], data[i+2]);

					// Get the new RGB value by shifting the HSL values
					// Hue        - Same as the target color
					// Saturation - Cut in half, so the colors aren't too bright
					// Lightness  - Intermediate value between desired color and template color, with a bias toward the template color
					let rgb = this.hslToRgb(target_hsl.h, target_hsl.s/2, (target_hsl.l + 2*hsl.l)/3);

					// Update the pixel to the new color
					data[i + 0] = rgb.r;
					data[i + 1] = rgb.g;
					data[i + 2] = rgb.b;
				}
			}

			// Draw the new data to the canvas
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
		
			return ({ h, s, l });
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
			this.$emit('click', this.status);
		},
	},
}
</script>