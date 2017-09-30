(function () {
    function SwipeView( controls, target ) {
        var self = this;
        //
        //
        //
        self.controls   = controls;
        self.target     = target;
        //
        //
        //
        self.pages = target.querySelectorAll( '.swipe-page' );
        //
        // hook tabs
        //
        self.tabs = controls.querySelectorAll( '.tab' );
        for ( var i = 0; i < self.tabs.length; i++ ) {
            (function(index){
                self.tabs[index].addEventListener('click', function(evt) {
                    self.select( index );
                },false);
            })(i);
        }
        self.select(0);
        //
        //
        //
        window.addEventListener( 'resize', function(evt) {
            self.reflow();
        },false);
    }
    SwipeView.prototype.select = function( index ) {
        var self = this;
        self.selected = index;
        //
        // update tabs
        //
        for ( var i = 0; i < self.tabs.length; i++ ) {
            if ( i === index ) {
                self.tabs[ i ].classList.add('selected');
            } else {
                self.tabs[ i ].classList.remove('selected');
            }
        }
        //
        // update target
        //
        self.reflow()
    }
    SwipeView.prototype.reflow = function() {
        var self = this;
        var width = self.target.offsetWidth;
        var x = -( self.selected * width );
        for ( var i = 0; i < self.pages.length; i++ ) {
            self.pages[ i ].style.left = x + 'px';
            x += width;
        }
    }
    //
    // hook all tabs
    //
    var controls = document.querySelectorAll('.tab-container');
    for ( var i = 0; i < controls.length; i++ ) {
        var target = controls[ i ].getAttribute('data-target');
        if ( target ) {
            var target_view = document.querySelector( '#' + target );
            if ( target_view ) {
                new SwipeView( controls[ i ], target_view );
            }
        }
    }
    
})();