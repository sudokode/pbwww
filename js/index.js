var API = (function(baseurl) {

    // method, args, uri
    function request(options) {
        options = options || {};

        var url = baseurl.concat(options.uri || '');

        args = $.extend({
            url: url,
            contentType: false,
            processData: false,
            dataType: 'json',
            type: options.method
        }, options.args);

        return $.ajax(args);
    }

    function _fd(data) {
        if (FormData.prototype.isPrototypeOf(data))
            return data;

        var fd = new FormData();

        $.each(data, function(key, value) {
            fd.append(key, value);
        });

        return fd;
    }

    function get(uri) {
        return request({
            method: 'GET',
            uri: uri,
            args: {
                dataType: 'text',
                accepts: {
                    text: "application/json",
                }
            }
        });
    }

    function put(data, uri) {

        return request({
            method: 'PUT',
            uri: uri,
            args: {
                data: _fd(data)
            }
        });
    }

    function post(data, uri) {

        return request({
            method: 'POST',
            uri: uri,
            args: {
                data: _fd(data)
            }
        });
    }

    // paste

    function paste_delete(uuid) {

        return request({
            method: 'DELETE',
            uri: uuid
        });
    }

    // url

    function url_post(data) {

        return post(data, 'u');
    }

    //

    return {
        paste: {
            post: post,
            put: put,
            delete: paste_delete,
            get: get,
        },
        url: {
            post: url_post
        },
    }
});


var WWW = (function(undefined) {

    function init() {
        $('#datetime').datetimepicker({
            icons: {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down',
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-compass',
                clear: 'fa fa-trash',
                close: 'fa fa-remove'
            },
        });
    }

    function alert_new() {

        var alert = $('#stash').find('.alert').clone();
        var target = $('#alert-col');

        target.append(alert);

        return { title: function (title, message, link) {
            var title, strong;
            if (link !== undefined)
                message = $('<a>')
                .attr('href', link)
                .text(message);

            strong = $('<strong>').text(title);
            title = $('<div>').append(strong).append(': ').append(message);

            return alert.append(title);
        }}
    }

    function clear() {

        $("#file-input").addClass('hidden');
        $('input').val('');
        $('textarea').val('');
        $(':checkbox').parent()
            .removeClass('active');

        $('#content').removeClass('hidden');
        $('#filename').addClass('hidden');

        $('input, button').not('.ignore-disable').prop('disabled', false);
    }

    function select_file() {

        var filename = $('#file-input').prop('files')[0].name;

        $('#content').addClass('hidden');
        $('#filename').removeClass('hidden')
            .children().text(filename);

        $('#shorturl').prop('disabled', true);
    }

    function paste_data(content_only) {

        var file, content,
            fd = new FormData();

        // hmm, could support multiple file uploads at once
        file = $('#file-input').prop('files')[0];
        content = $('#content').val();

        if (file !== undefined)
            fd.append('content', file);
        else
            fd.append('content', content);

        if (content_only == true)
            return fd;

        $('.api-input:checkbox').each(function() {
            var value = + $(this).is(':checked'),
                name = $(this).attr('name');

            if (value)
                fd.append(name, value);
        })

        $('.api-input:text:enabled').each(function() {
            var value = $(this).val(),
                name = $(this).attr('name');

            if (value)
                fd.append(name, value);
        });

        return fd;
    }

    var status_keys = ['status', 'uuid', 'sunset', 'error'];

    function api_status(data) {

        if (!Object.prototype.isPrototypeOf(data))
            return;

        var alert = alert_new();

        $.each(status_keys, function(index, key) {
            var title,
                value = data[key];

            if (value === undefined)
                return;

            if (key == 'status')
                alert.title(key, value, data.url);
            else
                alert.title(key, value);
        });
    }

    function set_uuid(data) {

        var uuid = data.uuid;

        if (uuid === undefined)
            return;

        $('#uuid').val(uuid);
    }

    function set_content(data, xhr) {

        var ct = xhr.getResponseHeader('content-type')
        if (ct.startsWith("text/")) {
            $('#content').val(data);
        } else {
            alert_new().title('status', 'cowardly refusing to display C-T: ' + ct);
        }
    }

    function url_data() {

        return {
            content: $('#content').val()
        }
    }

    function swap_sunset() {
        var sunset = $('#sunset'),
            hidden = sunset.find('input, span.fa'),
            visible = hidden.not('.hidden');

        hidden.removeClass('hidden').prop('disabled', false);
        visible.addClass('hidden').prop('disabled', true);
    }

    return {
        alert: alert,
        clear: clear,
        select_file: select_file,
        paste_data: paste_data,
        url_data: url_data,
        api_status: api_status,
        set_uuid: set_uuid,
        set_content: set_content,
        swap_sunset: swap_sunset,
        init: init
    };
});

$(function() {

    var api = API('https://ptpb.pw/');
    var app = WWW();

    function paste_submit(event) {
        var e = $(event.target),
            fd = app.paste_data(),
            fn = api.paste[e.data('method')];

        return fn(fd, e.uri()).done(function(data) {
            app.set_uuid(data);
        });
    }

    function try_json(xhr) {
        if (xhr.responseJSON !== undefined)
            return xhr.responseJSON;
        try {
            return $.parseJSON(xhr.responseText);
        } catch(err) {
            return {}
        }
    }

    var _xhr = $.ajaxSettings.xhr;
    $.ajaxSettings.xhr = function() {
        var res = _xhr();
        res.upload.addEventListener('progress', function(event) {
            $('.progress-bar').width(event.loaded / event.total * 100 + "%");
        });
        return res;
    }

    $.fn.extend({
        click: function(fn) {
            if (arguments.length == 0)
                return $(this).trigger('click');
	    $(this).on('click', function(event) {
                event.preventDefault();
                fn(event);
                event.target.blur();
            });
        },
        sclick: function(fn) {
            $(this).click(function(event) {
                var spinner = $(event.target).find('.fa-spinner'),
                    progress = $('.progress');
                spinner.removeClass('hidden');
                progress.removeClass('hidden');

                fn(event).always(function() {
                    spinner.addClass('hidden');
                    progress.addClass('hidden');
                    $('.progress-bar').width('0%');
                }).done(function(data) {
                    app.api_status(data);
                }).fail(function(xhr, status, error) {
                    var s = try_json(xhr);
                    console.log(xhr);
                    s[status] = error;
                    app.api_status(s);
                });
            });
        },
        uri: function(value) {
            uri = $(this).data('uri');
            if (uri !== undefined) {
                if (arguments.length != 0)
                    return $(uri).val(value);
                return $(uri).val();
            }
        }
    });

    $('#clear').click(function(event) {
        app.clear();
        $("#content").focus();
    });

    $('#file-input').change(function(event) {
        app.select_file();
    });

    $('#file').click(function(event) {
        $('#file-input').click();
    });

    $('#shorturl').sclick(function(event) {
        var fd = app.url_data();

        return api.url.post(fd);
    });

    $('#paste').sclick(paste_submit);
    $('#update').sclick(paste_submit);

    $('#delete').sclick(function(event) {
        var e = $(event.target)
        return api.paste.delete(e.uri()).done(function(data) {
            e.uri('');
        });
    });

    $('#load').sclick(function(event) {
        var e = $(event.target)
        return api.paste.get(e.uri()).done(function(data, status, xhr) {
            app.set_content(data, xhr);
        });
    });

    $('#paste-form').submit(function(event) {
        event.preventDefault();
    });

    $('#swap').click(app.swap_sunset);

    app.init();

    // refresh on firefox doesn't clear form values, but does clear
    // element state; whut
    app.clear();
});
