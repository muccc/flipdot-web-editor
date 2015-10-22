var dataUrl = "";
var light = 128;
var invert = false;
var blackBg = false;

$(function () {

  'use strict';



  // Demo
  // ---------------------------------------------------------------------------

    var $image = $('.img-container > img');

    var options = {
        aspectRatio: 128 / 64,
        preview: '.img-preview',
        crop: function(e) {
            setTimeout(function(){
                convertToBW($image)
            }, 0);
        },
        strict: false
    };

    $image.cropper(options)
    .cropper('setDragMode', "move");

    // Import image
    var $inputImage = $('#inputImage');
    var URL = window.URL || window.webkitURL;
    var blobURL;

    if (URL) {
      $inputImage.change(function () {
        var files = this.files;
        var file;

        if (!$image.data('cropper')) {
          return;
        }

        if (files && files.length) {
          file = files[0];

          if (/^image\/\w+$/.test(file.type)) {
            blobURL = URL.createObjectURL(file);
            $image.one('built.cropper', function () {
              URL.revokeObjectURL(blobURL); // Revoke when load complete
              $image.cropper('setDragMode', "move")
            })
            .cropper('reset')
            .cropper('replace', blobURL)

            $inputImage.val('');
            $("#rotate").slider("setValue", 0);
          } else {
            $body.tooltip('Please choose an image file.', 'warning');
          }
        }
      });
    } else {
      $inputImage.prop('disabled', true).parent().addClass('disabled');
    }

    $("#urlUpload").click(function(){
        convertToBlob($("#url").val()).then(function(str){
            
            $image.one('built.cropper', function () {
              $image.cropper('setDragMode', "move")
            })
            .cropper('reset')
            .cropper('replace', str)
            .cropper('setDragMode', "move")

            $("#rotate").slider("setValue", 0);
        });
    });    

    $("#download").click(function(){
        var link = document.createElement("a");
        link.download = "homescreen.png";
        link.href = dataUrl;
        link.click();
    });


    $("#rotate").slider()
    .slider('on', 'change', function(arg) {
        var diff = arg.oldValue - arg.newValue;
        $image.cropper('rotate', -diff);
    })

    $("#light").slider()
    .slider('on', 'change', function(arg) {
        light = 255-arg.newValue;
        setTimeout(function(){
            convertToBW($image)
        }, 0);
    })
    $('#blackBg').change(function() {
        blackBg = $(this).is(":checked");
        setTimeout(function() {
            convertToBW($image)
        }, 0);
    })

    $('#inverted').change(function() {
        invert = $(this).is(":checked");
        setTimeout(function() {
            convertToBW($image)
        }, 0);
    })
});

function convertToBlob(url) {

    var img = new Image();

    return new Promise(function(resolve) {
        img.onload = function() {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            canvas.remove();
            resolve(dataURL);
        };
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = "http://crossorigin.me/" + url;
    });
}

function convertToBW($image) {
    var canvas = $image.cropper('getCroppedCanvas', {
        width: 128,
        height: 64
    });
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0,0, 128, 64);
    var lightC = invert ? 0 : 255;
    var darkC = 255 - lightC;
    var bg = blackBg ? darkC : lightC;
    for (var j = 0; j < 64; j++) {
        for (var i = 0; i < 128; i++) {
            var index = (j*4) * imageData.width + (i * 4);
            var red = imageData.data[index];
            var green = imageData.data[index + 1];
            var blue = imageData.data[index + 2];
            var alpha = imageData.data[index + 3];
            var average = (red + green + blue) / 3;
            var color = (average < light) ? darkC : lightC;
            if (alpha === 0) {
                color = bg;
            }
            imageData.data[index] = color;
            imageData.data[index + 1] = color;
            imageData.data[index + 2] = color;
            imageData.data[index + 3] = 255; 
        }
    }
    ctx.putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);
    dataUrl = canvas.toDataURL("image/png");
    var bwImage = $("#preview-bw")[0];
    bwImage.src = dataUrl;
}
