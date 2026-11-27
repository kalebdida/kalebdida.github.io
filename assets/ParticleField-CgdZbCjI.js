import{n as e,t}from"./jsx-runtime-Wy9s6hX0.js";import{n,r,t as i}from"./index-NS4qRSQY.js";import{C as a,S as o,_ as s,a as c,b as l,c as u,d,f,g as p,h as m,i as h,l as g,m as _,r as v,s as y,t as b,u as x,v as ee,w as S,x as C,y as w}from"./three.module-C1_nOFbJ.js";var T=e(),E={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},D=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},O=new _(-1,1,1,-1,0,1),k=new class extends h{constructor(){super(),this.setAttribute(`position`,new y([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new y([0,2,0,0,2,0],2))}},A=class{constructor(e){this._mesh=new d(k,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,O)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},j=class extends D{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof w?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=C.clone(e.uniforms),this.material=new w({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new A(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},M=class extends D{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},N=class extends D{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},te=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new o);this._width=n.width,this._height=n.height,t=new S(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:u}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new j(E),this.copyPass.material.blending=0,this.timer=new l}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}M!==void 0&&(r instanceof M?n=!0:r instanceof N&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new o);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},ne=class extends D{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new c}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},P={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new c(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},F=class e extends D{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new o(256,256):new o(e.x,e.y),this.clearColor=new c(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new S(i,s,{type:u,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new S(i,s,{type:u,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new S(i,s,{type:u,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),s=Math.round(s/2)}let l=P;this.highPassUniforms=C.clone(l.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new w({uniforms:this.highPassUniforms,vertexShader:l.vertexShader,fragmentShader:l.fragmentShader}),this.separableBlurMaterials=[];let d=[6,10,14,18,22];i=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(d[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new o(1/i,1/s),i=Math.round(i/2),s=Math.round(s/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let p=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=p,this.bloomTintColors=[new a(1,1,1),new a(1,1,1),new a(1,1,1),new a(1,1,1),new a(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=C.clone(E.uniforms),this.blendMaterial=new w({uniforms:this.copyUniforms,vertexShader:E.vertexShader,fragmentShader:E.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new c,this._oldClearAlpha=1,this._basic=new f,this._fsQuad=new A(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new o(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new w({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new o(.5,.5)},direction:{value:new o(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new w({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};F.BlurDirectionX=new o(1,0),F.BlurDirectionY=new o(0,1);function I(e,t,n,r,i,o=new a){o.set(e/Math.max(1,n)*2-1,1-t/Math.max(1,r)*2,.5).unproject(i).sub(i.position).normalize();let s=-i.position.z/o.z;return o.multiplyScalar(s).add(i.position)}var re=class{constructor(){this.rectangles=new Map,this.frame=0,this.schedule=()=>{this.frame||=requestAnimationFrame(this.measure)},this.measure=()=>{this.frame=0,this.rectangles.clear(),document.querySelectorAll(`[data-particle-anchor]`).forEach(e=>{let t=e.getBoundingClientRect();t.width>0&&t.height>0&&this.rectangles.set(e.dataset.particleAnchor,{left:t.left+window.scrollX,top:t.top+window.scrollY,width:t.width,height:t.height})})},`ResizeObserver`in window&&(this.resize=new ResizeObserver(this.schedule)),this.resize?.observe(document.documentElement),this.mutations=new MutationObserver(this.schedule),this.mutations.observe(document.querySelector(`main`)??document.body,{childList:!0,subtree:!0}),window.addEventListener(`resize`,this.schedule),this.measure()}dispose(){cancelAnimationFrame(this.frame),this.resize?.disconnect(),this.mutations.disconnect(),window.removeEventListener(`resize`,this.schedule)}};function ie(e,t,n,r){let i=new Float64Array(t*n),a=0;for(let t=0;t<i.length;t++){let n=(.2126*e[t*4]+.7152*e[t*4+1]+.0722*e[t*4+2])/255;a+=(n*n+.015)*e[t*4+3]/255,i[t]=a}if(!a)return null;let o=new Float32Array(r*3),s=new Float32Array(r),c=19,l=()=>(c=Math.imul(c,1664525)+1013904223|0,(c>>>0)/4294967296);for(let c=0;c<r;c++){let r=l()*a,u=0,d=i.length-1;for(;u<d;){let e=u+d>>>1;i[e]<r?u=e+1:d=e}let f=u%t,p=Math.floor(u/t),m=(.2126*e[u*4]+.7152*e[u*4+1]+.0722*e[u*4+2])/255;o[c*3]=((f+l())/t-.5)*2,o[c*3+1]=(.5-(p+l())/n)*2*n/t,o[c*3+2]=(m-.5)*.1,s[c]=m}return{positions:o,brightness:s}}var L=t(),ae=`
  attribute vec3 aPortrait;
  attribute float aPortraitBrightness;
  attribute float aLink;
  attribute vec3 aBrain;
  attribute vec3 aTriad;
  attribute vec3 aConst;
  attribute vec3 aLand;
  attribute vec3 aDust;
  attribute vec3 aSound;
  attribute vec3 aLight;
  attribute float aSeed;
  attribute float aGroup;

  uniform mat3 uViewBasis;
  uniform vec3 uBrainTarget;
  uniform float uBrainScale;
  uniform vec3 uTriadTarget[3];
  uniform float uTriadScale[3];
  uniform vec3 uStarTarget[4];
  uniform vec3 uStarBase[4];
  uniform float uStarScale[4];
  uniform vec3 uLightTarget;
  uniform float uLightScale;
  uniform float uPortrait;
  uniform float uTransition;
  uniform float uTime;
  uniform float uFrom;
  uniform float uTo;
  uniform float uMix;
  uniform float uIntro;
  uniform float uCalm;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uLightDensity;
  uniform vec3 uOrbCenter;
  uniform vec3 uBrainCenter;
  uniform vec3 uLightCenter;
  uniform vec3 uTriadC0;
  uniform vec3 uTriadC1;
  uniform vec3 uTriadC2;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uAspect;
  uniform float uRippleAge;
  uniform float uMusic;
  uniform float uGravity;
  uniform vec2 uGaze;
  uniform float uBurstAge;
  uniform vec2 uRippleOrigin;
  uniform float uHl3;
  uniform float uHl3Amt;
  uniform float uHl4;
  uniform float uHl4Amt;

  varying float vAlpha;
  varying float vAccent;

  float sel(float idx, float i) { return 1.0 - step(0.5, abs(idx - i)); }

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
  vec3 gaze(vec3 p, vec2 a) { p = rotY(p, a.x); float c = cos(a.y), s = sin(a.y); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }

  void main() {
    float t = uTime;
    float g3 = min(2.0, floor(aGroup * 3.0));
    float g4 = min(3.0, floor(aGroup * 4.0));
    float isRing = step(0.88, aGroup);

    // 0 mind: a turning orb that breathes
    vec3 o = position - uOrbCenter;
    // the globe turns; its orbit stays put, like saturn's rings
    float isOrbit = step(0.9, aGroup);
    // when the cursor rests, the whole orb slowly turns to face it
    vec3 p0 = gaze(mix(rotY(o, t * 0.07) * (1.0 + sin(t * 0.8) * 0.012), o, isOrbit), uGaze) + uOrbCenter;

    // 1 brain: a slow sway
    vec3 brainLocal = mix(rotY(aBrain - uBrainCenter, sin(t * 0.18) * 0.2), aPortrait, uPortrait);
    vec3 p1 = uBrainTarget + uViewBasis * brainLocal * uBrainScale;

    // 2 triad: each cluster turns on its own axis (the circuit barely moves)
    vec3 tc = uTriadC0 * sel(g3, 0.0) + uTriadC1 * sel(g3, 1.0) + uTriadC2 * sel(g3, 2.0);
    int tri = int(g3);
    vec3 triLocal = aTriad - tc;
    // The lock always faces the camera. Only a small, upright sway is allowed.
    float sway = sin(t * 0.32) * 0.035;
    if (tri == 1) triLocal.xy = mat2(cos(sway), -sin(sway), sin(sway), cos(sway)) * triLocal.xy;
    else triLocal = rotY(triLocal, sin(t * .25) * .12);
    vec3 p2 = uTriadTarget[tri] + uViewBasis * triLocal * uTriadScale[tri];

    // 3 constellation: a tiny drift
    int star = int(g4);
    vec3 p3;
    if (aLink >= 0.0) {
      int start = star == 3 ? 2 : star;
      int end = star == 3 ? 3 : star + 1;
      p3 = mix(uStarTarget[start], uStarTarget[end], aLink);
    } else p3 = uStarTarget[star] + uViewBasis * (aConst - uStarBase[star]) * uStarScale[star];

    // 4 highlands: still ground, the camera moves instead
    vec3 p4 = aLand;

    // 5 dust: slow drift
    vec3 p5 = aDust + vec3(sin(t * 0.05 + aSeed * 30.0) * 0.3, cos(t * 0.04 + aSeed * 25.0) * 0.2, 0.0);

    // 6 sound: rolling waves
    vec3 p6 = aSound;
    p6.y += sin(p6.x * 0.7 + t * 0.9) * 0.22 + sin(p6.z * 1.1 - t * 0.7) * 0.16 + sin((p6.x + p6.z) * 0.4 + t * 0.5) * 0.12;

    // 7 light: a pulsing core inside a turning halo
    vec3 lp = aLight - uLightCenter;
    lp = mix(lp * (1.0 + sin(t * 1.6 + aSeed * 6.2831) * 0.18), rotY(lp, t * 0.25), isRing);
    vec3 p7 = uLightTarget + uViewBasis * lp * uLightScale;

    vec3 pa = p0 * sel(uFrom, 0.0) + p1 * sel(uFrom, 1.0) + p2 * sel(uFrom, 2.0) + p3 * sel(uFrom, 3.0)
            + p4 * sel(uFrom, 4.0) + p5 * sel(uFrom, 5.0) + p6 * sel(uFrom, 6.0) + p7 * sel(uFrom, 7.0);
    vec3 pb = p0 * sel(uTo, 0.0) + p1 * sel(uTo, 1.0) + p2 * sel(uTo, 2.0) + p3 * sel(uTo, 3.0)
            + p4 * sel(uTo, 4.0) + p5 * sel(uTo, 5.0) + p6 * sel(uTo, 6.0) + p7 * sel(uTo, 7.0);

    // each particle leaves at its own moment, and swirls a little on the way
    float m = smoothstep(0.0, 1.0, clamp((uMix - aSeed * 0.35) / 0.65, 0.0, 1.0));
    vec3 pos = mix(pa, pb, m);
    float travel = sin(m * 3.14159);
    pos += vec3(sin(aSeed * 41.0 + t * 0.6), cos(aSeed * 29.0 + t * 0.5), sin(aSeed * 17.0)) * travel * 0.45;

    // first load: everything arrives out of the dust
    float im = smoothstep(0.0, 1.0, clamp((uIntro - aSeed * 0.4) / 0.6, 0.0, 1.0));
    pos = mix(p5, pos, im);

    float wBrain = sel(uFrom, 1.0) * (1.0 - m) + sel(uTo, 1.0) * m;
    float wTriad = sel(uFrom, 2.0) * (1.0 - m) + sel(uTo, 2.0) * m;
    float wConst = sel(uFrom, 3.0) * (1.0 - m) + sel(uTo, 3.0) * m;
    float wLight = (sel(uFrom, 7.0) * (1.0 - m) + sel(uTo, 7.0) * m) * im;
    // shapes spread over a big area need bigger, brighter points to read
    float wMind = sel(uFrom, 0.0) * (1.0 - m) + sel(uTo, 0.0) * m;
    float wSpread = (sel(uFrom, 4.0) + sel(uFrom, 6.0)) * (1.0 - m) + (sel(uTo, 4.0) + sel(uTo, 6.0)) * m;

    // piano ripple (keys a to k)
    float rippleBoost = 0.0;
    if (uRippleAge < 3.5) {
      float rd = length(pos.xz - uRippleOrigin);
      float ring = exp(-pow(rd - uRippleAge * 3.2, 2.0) * 2.2);
      float fade = 1.0 - uRippleAge / 3.5;
      pos.y += ring * fade * 0.3;
      rippleBoost = ring * fade;
    }

    // music: while Kal is listening, a slow heartbeat rolls outward through the field
    float beat = pow(max(0.0, sin(t * 4.2 - length(pos) * 0.9)), 6.0) * uMusic;
    pos += normalize(pos + 0.0001) * beat * 0.12;

    pos.z -= uCalm * 3.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // the cursor field: particles drift out of the way, nothing quite touches it
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float push = (1.0 - smoothstep(0.0, 0.32, dist)) * uMouseStrength * (1.0 - uCalm);
    push *= 1.0 - .96 * clamp(wBrain + wTriad + wConst + wLight, 0.0, 1.0);
    mv.xy += (d / max(dist, 0.0001)) * push * 0.45 * (-mv.z / 7.0);

    // gravity well: hold the mouse down and the field falls toward it, with a slight swirl
    vec2 toMouse = uMouse - ndc;
    float well = uGravity * (0.35 + 0.6 * exp(-dist * 0.6));
    vec2 swirl = vec2(-toMouse.y, toMouse.x) * 0.35;
    vec2 fall = (toMouse * 0.92 + swirl) * well;
    // let go: everything near the well is flung back out in a ring
    float burst = 0.0;
    if (uBurstAge < 1.6) {
      burst = exp(-pow(dist - uBurstAge * 2.6, 2.0) * 3.0) * (1.0 - uBurstAge / 1.6);
      fall -= (toMouse / max(dist, 0.0001)) * burst * 0.4;
    }
    // ndc offset to view space (fov about 50 degrees)
    mv.xy += vec2(fall.x * uAspect, fall.y) * (-mv.z) * 0.47;
    gl_Position = projectionMatrix * mv;

    float hl = max(sel(g3, uHl3) * wTriad * uHl3Amt, sel(g4, uHl4) * wConst * uHl4Amt);
    float isCore = step(aSeed, 0.42);
    float firing = wBrain * smoothstep(0.985, 1.0, sin(t * 0.9 + aSeed * 80.0 + aBrain.y * 3.0));

    float base = mix(1.4, 2.6, fract(aSeed * 17.3)) * uSizeScale;
    float size = base * (1.0 + wConst * isCore * 0.8 + hl * 1.1 + wLight * (1.0 - isRing) * 1.4 + wSpread * 0.7 + wMind * 0.25)
               + rippleBoost * 2.5 + push * 1.6 + firing * 2.0 + beat * 2.4 + well * 1.6 + burst * 3.0;
    size *= 1.0 + uTransition * .25;
    gl_PointSize = size * uPixelRatio * min(8.0 / max(1.0, -mv.z), 1.7);

    // fade with distance, and fade spread-out ground near the camera so it never crowds the text
    float depthFade = (1.0 - smoothstep(3.0, 24.0, -mv.z)) * mix(1.0, smoothstep(2.5, 7.0, -mv.z), wSpread);
    float twinkle = 0.78 + 0.22 * sin(t * 1.7 + aSeed * 60.0);
    float lightDensity = mix(1.0, mix(uLightDensity, 1.0, isRing), wLight);
    vAlpha = depthFade * mix(0.5, 0.15, uCalm) * lightDensity * twinkle * (1.0 + hl * 1.4 + firing * 2.0 + wSpread * 1.1 + wMind * 0.9);
    vAlpha *= mix(1.0, .2 + aPortraitBrightness * 1.8, wBrain * uPortrait);
    vAlpha *= 1.0 + uTransition * .25;
    vAccent = clamp(wLight * (1.0 - isRing * 0.5) + rippleBoost * 0.85 + hl + firing + push * 0.6 + beat * 0.9 + well * 0.7 + burst, 0.0, 1.0);
  }
`,oe=`
  varying float vAlpha;
  varying float vAccent;
  uniform vec3 uBone;
  uniform vec3 uSignal;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = pow((1.0 - smoothstep(0.0, 0.5, d)), 1.8);
    gl_FragColor = vec4(mix(uBone, uSignal, vAccent), soft * vAlpha);
  }
`;function se(){try{let e=document.createElement(`canvas`),t=e.getContext(`webgl2`)||e.getContext(`webgl`);if(!t)return null;let n=t.getExtension(`WEBGL_debug_renderer_info`),r=String(t.getParameter(n?n.UNMASKED_RENDERER_WEBGL:t.RENDERER));return t.getExtension(`WEBGL_lose_context`)?.loseContext(),/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(r)}catch{return null}}function ce({mode:e,sceneRef:t}){let l=(0,T.useRef)(null),u=(0,T.useRef)(e);u.current=e;let[d,f]=(0,T.useState)(!0),[_,y]=(0,T.useState)(()=>typeof window<`u`&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches);return(0,T.useEffect)(()=>{let e=window.matchMedia(`(prefers-reduced-motion: reduce)`),t=e=>y(e.matches);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[]),(0,T.useEffect)(()=>{if(_)return;let e=l.current;if(!e)return;let d=se(),y=d&&!new URLSearchParams(window.location.search).has(`fullgl`);if(d===null){f(!1);return}let S;try{S=new b({antialias:!y,alpha:!0,powerPreference:`high-performance`})}catch{f(!1);return}let C=window.innerWidth<768,T=y?1:Math.min(window.devicePixelRatio||1,1.5);S.setPixelRatio(T),S.setSize(window.innerWidth,window.innerHeight),S.outputColorSpace=s,e.innerHTML=``,e.appendChild(S.domElement);let E=new ee,D=new m(50,window.innerWidth/Math.max(1,window.innerHeight),.1,60);D.position.set(0,.2,7.5);let O=y?3e3:C?3600:8e3,k=r(C),A=n(O,k),j=new h,M=(e,t=3)=>new v(e,t);j.setAttribute(`position`,M(A.list[i.mind])),j.setAttribute(`aBrain`,M(A.list[i.brain])),j.setAttribute(`aPortrait`,M(new Float32Array(O*3))),j.setAttribute(`aPortraitBrightness`,M(new Float32Array(O).fill(1),1)),j.setAttribute(`aLink`,M(A.link,1)),j.setAttribute(`aTriad`,M(A.list[i.triad])),j.setAttribute(`aConst`,M(A.list[i.constellation])),j.setAttribute(`aLand`,M(A.list[i.highlands])),j.setAttribute(`aDust`,M(A.list[i.dust])),j.setAttribute(`aSound`,M(A.list[i.sound])),j.setAttribute(`aLight`,M(A.list[i.light])),j.setAttribute(`aSeed`,M(A.seed,1)),j.setAttribute(`aGroup`,M(A.group,1));let N=e=>new a(e[0],e[1],e[2]),P=new w({vertexShader:ae,fragmentShader:oe,transparent:!0,depthWrite:!1,blending:2,uniforms:{uViewBasis:{value:new x},uBone:{value:new c(`#edeae3`)},uSignal:{value:new c(`#5ad1ff`)},uBrainTarget:{value:N(k.brainCenter)},uBrainScale:{value:1},uTriadTarget:{value:k.triadCenters.map(N)},uTriadScale:{value:[1,1,1]},uStarTarget:{value:k.starCenters.map(N)},uStarBase:{value:k.starCenters.map(N)},uStarScale:{value:[1,1,1,1]},uLightTarget:{value:N(k.pointCenter)},uLightScale:{value:1},uPortrait:{value:0},uTransition:{value:0},uTime:{value:0},uFrom:{value:0},uTo:{value:0},uMix:{value:0},uIntro:{value:0},uCalm:{value:+(u.current===`calm`)},uPixelRatio:{value:T},uSizeScale:{value:C?.9:1},uLightDensity:{value:160/O},uOrbCenter:{value:N(k.orbCenter)},uBrainCenter:{value:N(k.brainCenter)},uLightCenter:{value:N(k.pointCenter)},uTriadC0:{value:N(k.triadCenters[0])},uTriadC1:{value:N(k.triadCenters[1])},uTriadC2:{value:N(k.triadCenters[2])},uMouse:{value:new o(9,9)},uMouseStrength:{value:0},uAspect:{value:window.innerWidth/Math.max(1,window.innerHeight)},uRippleAge:{value:99},uMusic:{value:0},uGravity:{value:0},uGaze:{value:new o(0,0)},uBurstAge:{value:99},uRippleOrigin:{value:new o(0,0)},uHl3:{value:-1},uHl3Amt:{value:0},uHl4:{value:-1},uHl4Amt:{value:0}}}),L=new p(j,P);L.frustumCulled=!1,E.add(L);let ce=!1,le=(e=document.documentElement.dataset.theme)=>{let t=e===`light`;ce=t,P.uniforms.uBone.value.set(t?`#242429`:`#edeae3`),P.uniforms.uSignal.value.set(t?`#006f9c`:`#5ad1ff`),P.blending=t?1:2,P.needsUpdate=!0},ue=e=>{le(e.detail),fe(t.current.portrait)};le(),window.addEventListener(`kal:theme`,ue);let R=null,z=null,B=!y&&!C;B&&(R=new te(S),R.setPixelRatio(1),R.addPass(new ne(E,D)),z=new F(new o(window.innerWidth/2,window.innerHeight/2),.38,.45,.72),R.addPass(z));let de=new re,V=!1,H;function fe(t){if(!e||V||(H&&(H.onload=null,H.onerror=null),P.uniforms.uPortrait.value=0,delete e.dataset.portrait,delete e.dataset.portraitSrc,!t))return;let n=new Image;n.crossOrigin=`anonymous`,H=n,n.onload=()=>{if(!(V||H!==n))try{let r=document.createElement(`canvas`);r.width=160,r.height=Math.max(1,Math.round(160*n.naturalHeight/n.naturalWidth)),r.height=Math.min(240,r.height);let i=r.getContext(`2d`,{willReadFrequently:!0});if(!i)return;i.drawImage(n,0,0,r.width,r.height);let a=ie(i.getImageData(0,0,r.width,r.height).data,r.width,r.height,O);if(!a)return;j.getAttribute(`aPortrait`).copyArray(a.positions).needsUpdate=!0,j.getAttribute(`aPortraitBrightness`).copyArray(a.brightness).needsUpdate=!0,P.uniforms.uPortrait.value=1,e.dataset.portrait=`sampled`,e.dataset.portraitSrc=t}catch{e.dataset.portrait=`brain-fallback`}},n.onerror=()=>{e.dataset.portrait=`brain-fallback`},n.src=t}fe(t.current.portrait);let pe=()=>{k=r(C);let e=n(O,k);[`position`,`aBrain`,`aTriad`,`aConst`,`aLand`,`aDust`,`aSound`,`aLight`].forEach((t,n)=>{let r=j.getAttribute(t);r.array.set(e.list[n]),r.needsUpdate=!0});let t=P.uniforms;t.uStarBase.value=k.starCenters.map(N),t.uOrbCenter.value=N(k.orbCenter),t.uBrainCenter.value=N(k.brainCenter),t.uLightCenter.value=N(k.pointCenter),t.uTriadC0.value=N(k.triadCenters[0]),t.uTriadC1.value=N(k.triadCenters[1]),t.uTriadC2.value=N(k.triadCenters[2]),t.uSizeScale.value=C?.9:1},me=-100,he=e=>{let t=e.detail?.index??3;P.uniforms.uRippleOrigin.value.set((t/7-.5)*6,-.5),me=performance.now()*.001};window.addEventListener(`kal:piano-ripple`,he);let U=new o(9,9),W=0,ge=0,G=new o,_e=e=>{e.pointerType!==`touch`&&(U.set(e.clientX/window.innerWidth*2-1,-(e.clientY/window.innerHeight)*2+1),W=1,ge=performance.now()*.001)},ve=()=>{W=0};window.addEventListener(`pointermove`,_e,{passive:!0});let K=!1,q=0,ye=-99,be=e=>e instanceof Element&&!!e.closest(`a, button, input, textarea, select, label, summary, [role="button"], [contenteditable="true"], .note-card`),xe=e=>{e.button!==0||e.pointerType===`touch`||be(e.target)||(U.set(e.clientX/window.innerWidth*2-1,-(e.clientY/window.innerHeight)*2+1),q=window.setTimeout(()=>{K=!0,document.documentElement.classList.add(`gravity-well`),window.getSelection()?.removeAllRanges()},220))},J=()=>{clearTimeout(q),K&&(K=!1,ye=performance.now()*.001,document.documentElement.classList.remove(`gravity-well`))};window.addEventListener(`pointerdown`,xe),window.addEventListener(`pointerup`,J),window.addEventListener(`pointercancel`,J),window.addEventListener(`blur`,J),document.addEventListener(`pointerleave`,ve);let Se=()=>{let e=window.innerWidth,t=Math.max(1,window.innerHeight);D.aspect=e/t,D.updateProjectionMatrix(),S.setSize(e,t),R?.setSize(e,t),P.uniforms.uAspect.value=e/t;let n=e<768;n!==C&&(C=n,pe())};window.addEventListener(`resize`,Se);let Ce=document.hidden,we=()=>{Ce=document.hidden};document.addEventListener(`visibilitychange`,we);let Te=0,Y=performance.now()*.001,Ee=Y,X=0,De=!!window.__kalListening,Oe=e=>{De=!!e.detail};window.addEventListener(`kal:listening`,Oe);let Z=t.current.stage,Q=+(u.current===`calm`),ke=0,$=0,Ae=-1,je=-1,Me=0,Ne=0,Pe=new o(0,0),Fe=new a(0,0,0),Ie=new a,Le=new a,Re=0,ze=new URLSearchParams(window.location.search).has(`sceneDebug`),Be=t=>{let n=P.uniforms,r=window.innerWidth,i=window.innerHeight,a={},o=(e,n,o,s)=>{let c=de.rectangles.get(e);if(!c)return n.set(...s),1;let l=c.left-window.scrollX+c.width/2,u=c.top-window.scrollY+c.height/2;I(l,u,r,i,D,n),I(l+c.width/2,u,r,i,D,Ie),I(l,u+c.height/2,r,i,D,Le);let d=Math.min(Ie.distanceTo(n)*2/o[0],Le.distanceTo(n)*2/o[1]);if(ze&&t-Re>.2){let t=n.clone().project(D);a[e]={x:l,y:u,projectedX:(t.x+1)*r/2,projectedY:(1-t.y)*i/2,width:c.width,height:c.height,scale:d}}return d};n.uBrainScale.value=o(`brain`,n.uBrainTarget.value,[3.4,3],k.brainCenter);for(let e=0;e<3;e++)n.uTriadScale.value[e]=o(`discipline-${e}`,n.uTriadTarget.value[e],[2.1,1.9],k.triadCenters[e]);for(let e=0;e<4;e++)n.uStarScale.value[e]=o(`work-${e}`,n.uStarTarget.value[e],[2.3,2.3],k.starCenters[e]);n.uLightScale.value=o(`light`,n.uLightTarget.value,[2.5,2.5],k.pointCenter),n.uViewBasis.value.setFromMatrix4(D.matrixWorld),ze&&t-Re>.2&&(e.dataset.anchors=JSON.stringify(a),Re=t)},Ve=(e,t)=>e[Math.max(0,Math.min(e.length-1,t))]??i.dust;function He(){let e=performance.now()*.001,n=Math.min(.1,Math.max(.001,e-Y)),r=(e-Y)*1e3;if(Y=e,r>28&&!Ce?++X>24&&(X=0,B?B=!1:S.getPixelRatio()>1&&(S.setPixelRatio(1),S.setSize(window.innerWidth,window.innerHeight))):X=Math.max(0,X-1),!Ce){let r=t.current,a=u.current===`calm`,s=u.current===`lost`,c=a?[i.dust]:s?[i.dust,i.mind]:r.formations,l=a?0:s?.55:r.stage;Z=g.damp(Z,l,3.2,n),Q=g.damp(Q,+!!a,3.5,n),ke=g.damp(ke,r.journeyDrift,3.5,n),$=g.damp($,W,4,n);let d=Math.floor(Z),f=Ve(c,d),p=Ve(c,d+1),m=Math.min(1,Math.max(0,Z-d)),h=e=>(f===e?1-m:0)+(p===e?m:0),_=f===p?0:Math.sin(m*Math.PI),v=h(i.highlands),y=h(i.light);r.hl3>=0&&(Ae=r.hl3),r.hl4>=0&&(je=r.hl4),Me=g.damp(Me,+(r.hl3>=0),7,n),Ne=g.damp(Ne,+(r.hl4>=0),7,n);let b=P.uniforms;b.uTransition.value=_,z&&(z.strength=.38+_*.6),b.uTime.value=e,b.uFrom.value=f,b.uTo.value=p,b.uMix.value=m,b.uIntro.value=Math.min(1,(e-Ee)/2.6),b.uCalm.value=Q,b.uRippleAge.value=Math.max(0,e-me),b.uMusic.value+=(+!!De-b.uMusic.value)*Math.min(1,n*.8),b.uGravity.value+=(+!!K-b.uGravity.value)*Math.min(1,n*(K?1.4:9)),b.uBurstAge.value=Math.max(0,e-ye);let x=W&&e-ge>1.4&&!K;x?G.set(Math.max(-1,Math.min(1,U.x-.35))*.75,Math.max(-1,Math.min(1,U.y))*-.45):G.set(0,0),b.uGaze.value.lerp(G,Math.min(1,n*(x?.7:2.5))),b.uHl3.value=Ae,b.uHl3Amt.value=Me,b.uHl4.value=je,b.uHl4Amt.value=Ne,b.uMouseStrength.value=$,b.uMouse.value.lerp(U,1-Math.exp(-8*n)),Pe.lerp($>.01?U:new o(0,0),1-Math.exp(-2*n));let ee=(ke-.5)*7*v+Pe.x*.3*(1-Q),C=.2+.9*v+Pe.y*.18*(1-Q),w=7.5-1.1*v-.6*y-_*.55;D.position.x=g.damp(D.position.x,ee,3,n),D.position.y=g.damp(D.position.y,C,3,n),D.position.z=g.damp(D.position.z,w,3,n),Fe.set(ee*.8,-.9*v,-1.5*v),D.lookAt(Fe),D.updateMatrixWorld(),Be(e),B&&R&&!ce?R.render():S.render(E,D)}Te=y?window.setTimeout(He,50):requestAnimationFrame(He)}return He(),()=>{window.removeEventListener(`kal:listening`,Oe),cancelAnimationFrame(Te),clearTimeout(Te),window.removeEventListener(`kal:piano-ripple`,he),window.removeEventListener(`kal:theme`,ue),window.removeEventListener(`pointermove`,_e),window.removeEventListener(`pointerdown`,xe),window.removeEventListener(`pointerup`,J),window.removeEventListener(`pointercancel`,J),window.removeEventListener(`blur`,J),clearTimeout(q),document.documentElement.classList.remove(`gravity-well`),document.removeEventListener(`pointerleave`,ve),window.removeEventListener(`resize`,Se),document.removeEventListener(`visibilitychange`,we),V=!0,H&&(H.onload=null,H.onerror=null),de.dispose(),j.dispose(),P.dispose(),R?.dispose(),S.dispose()}},[_,t]),(0,L.jsxs)(`div`,{"data-testid":`particle-field-container`,className:`fixed inset-0 pointer-events-none z-0 overflow-hidden`,"aria-hidden":`true`,children:[(0,L.jsx)(`div`,{className:`particle-fallback absolute inset-0 transition-opacity duration-700 ${!d||_?`opacity-100`:`opacity-50`}`}),(0,L.jsx)(`div`,{ref:l,className:`w-full h-full`})]})}export{ce as ParticleField};