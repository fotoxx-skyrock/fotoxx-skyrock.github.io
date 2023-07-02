/*
Organiser les vignettes comme dans les archives
*/
;(function ($) {
    $.fn.skyArchives = function (opt) {
        opt = $.extend(true, {
            nbPages: '',
            currentPage: '',
            bt: null,
            spinner: null,
            col: 5,
            marge: 10,
            defaultImgSize: 100,
            ajax_url: ''
        }, opt);

        var skyArchives = {
            wrapper: null,
            isLoading: false,
            nbItem: 0,
            flag: false,
            imgLoaded: 0,
            lastImgLoaded: -1,

            init: function (wrapper) {
                this.wrapper = $(wrapper);
                opt.bt.click(function (e) {
                    e.preventDefault();
                    skyArchives.loadMore();
                });
                this.listImg = this.wrapper.find('img.imagepreview');
                //            skyArchives.nbItem = this.listImg.length;
                this.listImg.each(function (i, e) {
                    $(e)._imgNb = skyArchives.nbItem++;
                    $(e).load(function () {
                        skyArchives.resizeImage($(this), false);
                    });
                    if (e.complete) {
                        skyArchives.resizeImage($(e), false);
                    }
                });
                var reg_hash = new RegExp(/#page[0-9]+/);
                if (window.location.hash.match(reg_hash)) {
                    var hrefPage = window.location.href;
                    var locationPage = hrefPage.substring(0, hrefPage.lastIndexOf('/') + 1);
                    var anchorPage = hrefPage.substring(hrefPage.lastIndexOf('#') + 1);
                    window.location = locationPage + anchorPage + '.html';
                }
                skyArchives.delayedSetPosition();
            },

            delayedSetPosition: function () {
                skyArchives._timer_timeout = (new Date()).getTime() + 3 * 1000; // au bout de 3 secondes on affiche !
                skyArchives._timer = setInterval(function () {
                    // on a deja affiché, donc on arrete...
                    if (skyArchives.flag) {
                        clearTimeout(skyArchives._timer);
                        return;
                    }

                    var to = ((new Date()).getTime() > skyArchives._timer_timeout);
                    if (to || skyArchives.imgLoaded >= skyArchives.nbItem) {
                        skyArchives.setPositionArchives();
                        clearTimeout(skyArchives._timer);
                    }
                }, 250);
            },

            loadMore: function () {
                // Au-delà de la pagination ?
                if (opt.currentPage + 1 > opt.nbPages) {
                    opt.bt.hide();
                    opt.spinner.hide();
                    return false;
                }

                this.isLoading = true;
                window.location.hash = 'page' + (opt.currentPage + 1);

                // Requête AJAX
                $.ajax({
                    url: opt.ajax_url + (opt.currentPage + 1),
                    type: 'get',
                    dataType: 'json',
                    beforeSend: function () {
                        opt.bt.hide();
                        opt.spinner.show();
                    },
                    success: function (data) {
                        for (var annee in data.articles) {
                            var ul = '';
                            var tpl = '';
                            ul += '<h3 class="bloc_title">' + annee.replace("a", "") + '</h3>';
                            ul += '<ul>';
                            var same_year = false;
                            $.each(data.articles[annee], function (i, v) {
                                same_year = !! (v.same_year);

                                if (typeof (v.url_image) != 'undefined' && v.url_image != false) {
                                    tpl += '<li class="itemli newImgArchive">';
                                    tpl += '<img class="imagepreview" src="' + v.url_image + '" />';
                                    if (typeof (v.has_video) != 'undefined') {
                                        tpl += '<img class="video_play" src="' + static_img_url + 'img/icons/video_play.png" alt="Lire la vidéo titre article vidéo" />';
                                    }
                                } else {
                                    tpl += '<li class="itemli istext">';
                                    tpl += '<a class="permalink" href="' + v.url + '" class="permalink">';
                                    tpl += '<strong>' + v.title + '</strong>';
                                    tpl += v.text;
                                    tpl += '</a>';
                                }

                                if (v.nb_commentaires) {
                                    tpl += '<a href="' + v.url + '" class="overlay"><span class="overlay_date">' + v.date + '<br/>' + v.nb_commentaires + '</span></a>';
                                } else {
                                    tpl += '<a href="' + v.url + '" class="overlay"><span class="overlay_date">' + v.date + '</span></a>';
                                }
                                tpl += '</li>';
                            });

                            var lastUl = skyArchives.wrapper.find('ul:last');
                            if (same_year) {
                                lastUl.append(tpl);
                            } else {
                                ul += tpl;
                                ul += '</ul>';
                                lastUl.after(ul);
                            }
                        }

                        var newListImg = skyArchives.wrapper.find('.newImgArchive img.imagepreview');
                        skyArchives.nbItem += newListImg.length;
                        skyArchives.flag = false;
                        skyArchives.wrapper.find('li.itemli').css('visibility', 'hidden');

                        // Fonction de resize des colonnes du blog (dans js/blog.js)
                        resizeColumns();
                        opt.currentPage = data.page;
                        opt.isLoading = false;

                        // Gestion des tailles des images
                        newListImg.error(function () {
                            skyArchives.resizeImage($(this), true);
                        });
                        newListImg.load(function () {
                            skyArchives.resizeImage($(this), false);
                        });
                        if (newListImg.complete) {
                            skyArchives.resizeImage(newListImg, false);
                        }

                        // Et on oublie pas à la fin de redispatcher tout le monde
                        skyArchives.delayedSetPosition();
                    }
                });
            },

            resizeImage: function (img, error) {
                img.parent('li').removeClass('newImgArchive');
                if (error) {
                    img.parent('li').css('height', opt.defaultImgSize + 'px');
                    img.css({
                        height: opt.defaultImgSize + 'px',
                        width: '100%'
                    });
                    img.parent('li').find('.overlay').css({
                        height: opt.defaultImgSize + 'px',
                        lineHeight: opt.defaultImgSize + 'px'
                    });
                    skyArchives.imgLoaded++;
                } else {
                    var getImageHeight = parseInt(img.height());
                    var getImageWidth = parseInt(img.width());
                    var ratioImg = getImageWidth / getImageHeight;
                    //console.log(skyArchives.imgLoaded, skyArchives.nbItem, getImageHeight, getImageWidth, Math.floor(opt.defaultImgSize / ratioImg));
                    getImageHeight = parseInt(opt.defaultImgSize / ratioImg);
                    if (isNaN(getImageHeight)) {
                        getImageHeight = opt.defaultImgSize;
                    }
                    if (isNaN(getImageWidth)) {
                        getImageWidth = opt.defaultImgSize;
                    }
                    img.parent('li').css({
                        height: getImageHeight + 'px'
                    });
                    img.css({
                        height: getImageHeight + 'px',
                        width: '100%'
                    });
                    img.parent('li').find('.overlay').css({
                        height: getImageHeight + 'px',
                        lineHeight: getImageHeight + 'px'
                    });
                    skyArchives.imgLoaded++;
                }
            },

            setPositionArchives: function () {
                var listItem = new Array();
                listItem = skyArchives.wrapper.find('li.itemli');
                var posY = itemHeight = 0;
                var posX = 0;
                var itemHeight = 0;
                var containerHeight = new Array();

                // console.log("setPositionArchives");
                listItem.each(function () {
                    $(this).removeClass('itemli');

                    if ($(this).prev().length) {
                        posX = parseInt($(this).prev().css('left'));
                        posX += parseInt($(this).prev().css('width'));
                        posX += opt.marge;

                        if ($(this).prev().hasClass('istext')) {
                            posX += opt.marge * 2;
                        }

                        var modeleLi = $($(this).prevAll()[opt.col - 1]);
                        if (modeleLi.length) {
                            if (parseInt(modeleLi.css('left')) == 0) {
                                posX = 0;
                            }
                            posY = parseInt(modeleLi.css('height'));
                            posY += parseInt(modeleLi.css('top'));
                            posY += opt.marge;
                            if (modeleLi.hasClass('istext')) {
                                posY += opt.marge * 3;
                            }
                        }
                    } else {
                        containerHeight = new Array();
                        posX = posY = 0;
                    }
                    $(this).css({
                        left: posX + 'px',
                        top: posY + 'px',
                        visibility: 'visible'
                    });

                    itemHeight = parseInt($(this).css('height'));
                    itemHeight += parseInt($(this).css('top'));
                    itemHeight += opt.marge * 2;

                    if ($(this).hasClass('istext')) {
                        itemHeight += opt.marge * 2;
                    }
                    containerHeight.push(itemHeight);
                    var itemMax = Math.max.apply(Math, containerHeight);
                    $(this).parent('ul').css({
                        height: itemMax + 'px'
                    });
                });

                if (opt.bt.length) {
                    opt.spinner.hide();
                    if (opt.currentPage < opt.nbPages) {
                        opt.bt.show();
                    } else {
                        opt.bt.hide();
                    }
                }
                resizeColumns();
                skyArchives.flag = true;
            }
        };

        return this.each(function (i, wrapper) {
            skyArchives.init(wrapper);
        });
    };
})(jQuery);
