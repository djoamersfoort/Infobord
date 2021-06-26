module.exports = {
	slides: function() {
		this.slides = [];

		this.add = (slide) => {
			this.slides.push(slide);
		};
		this.edit = (i, slide) => {
			this.slides[i] = slide;
		};
		this.remove = (index) => {
			this.slides.splice(index, 1);
		};
		this.get = (i) => {
			if(i !== null && i !== undefined) {
				return this.slides[i];
			} else {
				return this.slides;
			}
		};

		return this;
	},
	slide: function(background, title, content) {
		this.background = background;
		this.title = title;
		this.content = content;

		return this;
	}
};
