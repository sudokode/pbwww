$(document).ready(function() {
  document.title = "pb";

  $("a").attr("title", "Opens in a new tab");

  $("button").addClass("btn btn-default");

  // button colors
  $("button#delete").addClass("btn-danger");
  $("button#submit").addClass("btn-primary");
  $("button#clear").addClass("btn-danger");


  $("#file").hide();

  $("#clear").click(function(e) {
    e.preventDefault();

    $("#text").val("");
    $("#private").prop("checked", false);
    $("#expire").val("");
    $("#file").val("");
    $("#filename").text("");
    $("#pasteid").val("");
    $("#uuid").val("");

    $("#paste_response").hide();
    $("#text").focus();
  });

  function getData() {
    data = {
      c: $("#text").val()
    }

    if ($("#private").prop("checked")) {
      data.p = 1;
    }

    if ($("#expire").val() > 0) {
      data.s = $("#expire").val() * 3600;
    }

    return data;
  }

  function displayResponse(response) {
    $("#paste_error").hide();
    $("#paste_response").show();

    $("#response_url").attr("href", response.url);
    $("#response_url").text(response.url);
    $("#response_status").text(response.status);
    $("#response_uuid").text(response.uuid);
    $("#pasteid").val(response.short);

    if (response.uuid) {
      $("#uuid").val(response.uuid);
    }
  }

  function displayError(text) {
    $("#paste_response").hide();
    $("#paste_error").show();

    $("#paste_error").text(text);
    // makes the error message stand out a bit 
    $("#paste_error").addClass("alert alert-danger");
  }

  function submitForm(route) {
    if (!route) {
      return;
    }
    $.ajax({
      url: "https://ptpb.pw" + route,
      method: "POST",
      data: getData(),
      dataType: "json",
      success: function(response) {
        console.log(response);
        displayResponse(response);
      },
      error: function(jqxhr) {
        displayError(jqxhr.responseText);
      }
    });
  }

  function loadPaste(id) {
    if (!id) {
      return;
    }

    $.ajax({
      url: "https://ptpb.pw/" + id,
      success: function(data) {
        $("#text").val(data);
      },
      fail: function(jqxhr) {
        displayError(jqxhr.responseText);
      }
    });
  }

  function updatePaste(uuid) {
    if (!uuid) {
      return;
    }

    $.ajax({
      url: "https://ptpb.pw/" + uuid,
      method: "PUT",
      data: getData(),
      dataType: "json",
      success: function(response) {
        console.log(response);
        displayResponse(response);
      },
      fail: function(jqxhr) {
        displayError(jqxhr.responseText);
      }
    });
  }

  function deletePaste(uuid) {
    $.ajax({
      url: "https://ptpb.pw/" + uuid,
      method: "DELETE",
      dataType: "json",
      success: function(data) {
        $("#clear").trigger("click");
      },
      fail: function(jqxhr) {
        displayError(jqxhr.responseText);
      }
    });
  }

  $("#paste").submit(function(e) {
    if (!$("#file").val()) {
      e.preventDefault();

      if (!$("#text").val()) {
        alert("Enter text or select a file to paste!");
        return;
      }

      submitForm("/");
    }

    $("#expire").val($("#expire").val() * 3600);
  });

  $("#shorten").click(function(e) {
    e.preventDefault();
    submitForm("/u");
  });

  $("#load").click(function(e) {
    e.preventDefault();
    loadPaste($("#pasteid").val());
  });

  $("#update").click(function(e) {
    e.preventDefault();
    updatePaste($("#uuid").val());
  });

  $("#delete").click(function(e) {
    e.preventDefault();
    deletePaste($("#uuid").val());
  });

  $("#file_btn").click(function(e) {
    e.preventDefault();
    $("#file").trigger("click");
  });

  $("#file").change(function(e) {
    $("#filename").text($(this).val());
  });

  $("#expire,#private").keypress(function(e) {
    var code = e.keyCode || e.which;

    if (code == 13) {
      e.preventDefault();
    }
  });

  $("#pasteid").keypress(function(e) {
    var code = e.keyCode || e.which;

    if (code == 13) {
      e.preventDefault();

      if ($(this).val()) {
        loadPaste($(this).val());
      } else {
        alert("No ID!");
      }
    }
  });

  $("#uuid").keypress(function(e) {
    var code = e.keyCode || e.which;

    if (code == 13) {
      e.preventDefault();

      if ($(this).val()) {
        updatePaste($(this).val());
      } else {
        alert("No UUID!");
      }
    }
  });

  $("#expire").on("input", function(e) {
    var v = $(this).val();

    if (v == 1) {
      $("#hours").text("hour");
    } else if (v == 0) {
      $(this).val("");
      $("#hours").text("hours");
    } else {
      $("#hours").text("hours");
    }
  });
});
