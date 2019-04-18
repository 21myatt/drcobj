/**
 * @author Blinking / https://blinking.fun/
 * 
 * MIT License
 * 
 * Copyright (c) 2019 Blinking
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

'use strict';

THREE.DrcobjLoader = function (manager) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

THREE.DrcobjLoader.prototype = {

  constructor: THREE.DrcobjLoader,

  load: function (url, onLoad, onProgress, onError) {

    var self = this;

    var fileLoader = new THREE.FileLoader(self.manager);
    fileLoader.setPath(self.path);
    fileLoader.setResponseType("arraybuffer");
    fileLoader.load(url, function (buffer) { self.parse(buffer, onLoad); }, onProgress, onError);

  },

  setPath: function (value) {
    this.path = value;
  },

  parse: function (buffer, onLoad) {

    var self = this;

    THREE.DRACOLoader.setDecoderConfig({ type: "wasm" });

    if (self.dracoLoader === undefined) {
      self.dracoLoader = new THREE.DRACOLoader();
      self.objectLoader = new THREE.ObjectLoader();
    }

    var modelDataSize = (new Uint32Array(buffer, 0, 1))[0];
    var modelData = new Uint8Array(buffer, 4, modelDataSize);

    var jsonData = JSON.parse(THREE.LoaderUtils.decodeText(modelData));

    var geometriesDataOffset = 4 + modelDataSize;

    var finishCount = 0;

    for (let i = 0; i < jsonData.geometries.length; i++) {

      var geometryBufferStart = geometriesDataOffset + jsonData.geometries[i].data.offset;
      var geometryBufferEnd = geometryBufferStart + jsonData.geometries[i].data.byteLength;

      var geometryBuffer = buffer.slice(geometryBufferStart, geometryBufferEnd);

      self.dracoLoader.decodeDracoFile(geometryBuffer, function (geometry) {

        jsonData.geometries[i].data = geometry.toJSON().data;

        ++finishCount;

      });

    }

    var timer = setInterval(() => {

      if (finishCount === jsonData.geometries.length) {

        clearInterval(timer);

        onLoad(self.objectLoader.parse(jsonData));

      }

    }, 50);

  }

};