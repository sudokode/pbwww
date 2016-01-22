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
                accepts: "application/json, *.*",
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

        $('input').val('');
        $('textarea').val('');
        $(':checkbox').parent()
            .removeClass('active');

        $('#content').removeClass('hidden');
        $('#filename').addClass('hidden');

        $('input, button').prop('disabled', false);
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
                name = $(this).attr('id');

            if (value)
                fd.append(name, value);
        })

        $('.api-input:text').each(function() {
            var value = $(this).val(),
                name = $(this).attr('id');

            if (value)
                fd.append(name, value);
        });

        return fd;
    }

    var status_keys = ['status', 'uuid', 'sunset', 'error'];

    function api_status(data) {

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

    return {
        alert: alert,
        clear: clear,
        select_file: select_file,
        paste_data: paste_data,
        url_data: url_data,
        api_status: api_status,
        set_uuid: set_uuid,
        set_content: set_content
    };
});

$(function() {

    var api = API('https://ptpb.pw/');
    var app = WWW();

    function paste_submit(cb, uri, content_only) {

        var fd = app.paste_data(content_only);

        return cb(fd, uri).done(function(data) {
            app.set_uuid(data);
        });
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
                var spinner = $(event.target).find('.fa-spinner');
                spinner.removeClass('hidden');

                console.log('fn');
                fn(event).always(function() {
                    spinner.addClass('hidden');
                }).done(function(data) {
                    app.api_status(data);
                }).fail(function(xhr, status, error) {
                    var s = xhr.responseJSON || {};
                    console.log(xhr);
                    s[status] = error;
                    app.api_status(s);
                });
            });
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

        return api.url.post(fd)
    });

    $('#paste').sclick(function(event) {
        var label = $("#label").val();

        return paste_submit(api.paste.post, label);
    });

    $('#update').sclick(function(event) {
        var uuid = $("#uuid").val();

        return paste_submit(api.paste.put, uuid, true);
    });

    $('#delete').sclick(function(event) {
        var uuid = $('#uuid');

        return api.paste.delete(uuid.val()).done(function(data) {
            uuid.val('');
        });
    });

    $('#load').click(function(event) {
        var spinner = $(this).find('.fa-spinner'),
            id = $('#pasteid').val();

        spinner.removeClass('hidden');
        api.paste.get(id).done(function(data, status, xhr) {
            app.set_content(data, xhr);
            spinner.addClass('hidden');
        });
    });

    $('#paste-form').submit(function(event) {
        event.preventDefault();
    });

    // refresh on firefox doesn't clear form values, but does clear
    // element state; whut
    app.clear();
});
