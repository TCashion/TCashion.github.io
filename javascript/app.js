// READ variables
var chartLabels = [];
var chartData = [];
var backendArray = []; 

$(document).ready(function () {   

    // READ variables
    var activityName;
    var startTime;
    var startTimeLegible;
    var stopTime;
    var stopTimeLegible;
    var handle; 
    var timer;
    var now; 
    var duration;
    var durationLegible;

    // MODULE Authentication
    
    // check auth status and adjust nav display if user already logged in 
        auth.onAuthStateChanged(user => {
            if (user) {
            console.log("user logged in: ", user);
            $(".auth-buttons").hide(250);
            $("#log-out-div").slideDown(250);
            var email = user.email;
            var welcomeMessa
            ge = `Welcome back, ${email}!`;
            $("#welcome-message").html(welcomeMessage);
            logOut(); 
            } else {
                console.log("user logged out");
            };
        });

    // brings up sign-up form
    $("#sign-up").on("click", function (event) {
        event.preventDefault();

        $(".auth-buttons").hide(250);
        $("#nav-sign-up").slideDown(250); 

        // reverses action in case user needs to cancel 
        $("#sign-up-go-back").on("click", function (event) {
            event.preventDefault();
            $("#nav-sign-up").hide(250);
            $(".auth-buttons").slideDown(250);
        });

        // collect user signup data
        $("#sign-up-form").on("submit", function (event) {
            event.preventDefault(); 
            const email = $("#sign-up-email").val();
            const password = $("#sign-up-password-verified").val(); 

            // sign up the user
            auth.createUserWithEmailAndPassword(email, password).then(cred => {
                $("#nav-sign-up").hide(250);
                $("#log-out-div").slideDown(250); 

                // Display welcome message for new user
                var welcomeMessage = `Welcome, ${email}!`;
                $("#welcome-message").html(welcomeMessage);
                $("#sign-up-email").val("");
                $("#first-password").val("");
                $("#sign-up-password-verified").val("");
            });

            // enable logout function
            logOut(); 
        });
    });

    // brings up the sign-in form
    $("#sign-in").on("click", function(event) {
        event.preventDefault();

        $(".auth-buttons").hide(250);
        $("#nav-sign-in").slideDown(250);

        // reverses action in case user needs to cancel 
        $("#sign-in-go-back").on("click", function (event) {
            event.preventDefault();
            $("#nav-sign-in").hide(250);
            $(".auth-buttons").slideDown(250);
        });   

        // sign-in functionality
        $("#sign-in-form").on("submit", function (event) {
            event.preventDefault();
            const email = $("#sign-in-email").val();
            const password = $("#sign-in-password").val();
            auth.signInWithEmailAndPassword(email, password).then(cred =>
                {
                    $("#nav-sign-in").hide(250);
                    $("#log-out-div").slideDown(250); 

                    // Display welcome message for returning user
                    var welcomeMessage = `Welcome back, ${email}!`;
                    $("#welcome-message").html(welcomeMessage);
                    $("#sign-in-email").val("");
                    $("#sign-in-password").val("");
                });
            
            // enable logout function
            logOut();
        });     
    });

    // logout defined for reusability
    function logOut() {
        $("#log-out-button").on("click", function () {
            auth.signOut().then(() => {
                $("#log-out-div").hide(250);
                $(".auth-buttons").show(250);
                $("#welcome-message").html("");
            });    
        });
    };
    // END MODULE Authentication


    // MODULE trackTime: on click of "start time" button: 
    $("#startTimer").on("click", function (event) {
        event.preventDefault();

            // HIDE "start time" button and input form and SHOW timer and "stop timer" button
        $(".inputForm").hide();
        $(".timerHide").slideDown(500);

            // ASSIGN var for present time at time of button click and var for string in the input form at time of click
        activityName = $("#nameActivity").val();
        startTime = moment();
        startTimeLegible = moment(startTime).format("hh:mm:ss a").toString();

            // DISPLAY activityName as string in column 1 of the table and currentTime as string in column 3 of the table
        var tableItemHtml = `
            <tr>
                <td>${activityName}</td>
                <td id="replace1">--:--</td>
                <td>${startTimeLegible}</td>
                <td id="replace2">--:--</td>
            </tr>
        `;
        $("#timeLog").append(tableItemHtml);

        // run stopwatch function
        runClock();
    });
    // END MODULE trackTime


    // MODULE logTime:  on click of "Stop" button, timer stops and disappears, form and "start timer" button reappear.
    $("#stopTimer").on("click", function(event) {
        event.preventDefault();

            // HIDE "stop" button and timer and SHOW "start time" button and input form
        $(".timerHide").hide();
        $(".inputForm").slideDown(500);

            // ASSIGN var for present time at time of button click
        stopTime = moment();
        stopTimeLegible = moment(stopTime).format("hh:mm:ss a").toString();
        var endTime = `
            <td>${stopTimeLegible}<td>
        `;

            // DISPLAY currentTime as string in column 4 of table
        $("#replace2").replaceWith(endTime);

        // run stopwatch stop function
        stopClock();
        
        // run update chart function
        updateChart();

    });
    // END MODULE logTime


    // STOPWATCH FUNCTION

    // BUG : current code works with counting seconds and minutes, but when hours are factored, it adds 5 hours for some reason, so clock starts at 05:00:00:0

    function runClock() {
    
        // calls out html element where time will be displayed
        timer = document.getElementById("timer");

        // creates the functionality for the application to count seconds
        handle = setInterval(() => {
            now = moment();
            duration = (now - startTime);
            
            // workaround for moment.js timer display issue. Adds hours to clock as it counts 
            var H = 0;
            H = H + Math.floor( duration / 3600000);

            // converts the time into a legible string format
            var durationLegible = moment(duration).format(`${H}:mm:ss:S`);
                // test
            console.log("startTime: " + startTime); 
            console.log("now: " + now);
            console.log("now - startTime: " + duration);

            // Displays the running timer in the DOM of the #timer element
            timer.textContent = durationLegible;
        }, 100);
    };

    function stopClock() {

        // at time of button click, measure and display duration of current time session
        durationLegible = moment(duration).format("mm:ss").toString(); 
        var durationDisplay = `
            <td>${durationLegible}</td>
        `;
        $("#replace1").replaceWith(durationDisplay);

        // IF activity name is already listed, ADD duration to existing object to show cumulative time on graph, ELSE push new data to arrays 
        backendArray.push({"label": activityName, "duration": duration, "startTime": startTimeLegible, "endTime": stopTimeLegible});

        // reset variables and DOM of timer element to 00 : 00
        clearInterval(handle);
        now = "00 : 00";
        timerCount = "00 : 00";
        timerCountLegible = "00 : 00"; 
        timer.textContent = timerCountLegible; 

        // add data to firebase 
        // COMMENTED OUT DURING TESTING PHASE 
        // db.collection("timelog").add({
        //         activity: activityName,
        //         duration: duration,
        //         start: startTimeLegible,
        //         end: stopTimeLegible
        // });

        // combines data if the activityName already exists
        for ( var i = 0; i < (chartLabels.length); i++) {
            if ( activityName === chartLabels[i]) {
                console.log("duplicate");
                chartData[i] = chartData[i] + duration ;
                return;
            } 
        };

        chartLabels.push(activityName);
        chartData.push(duration);
        console.log("chartLabels : " + chartLabels);
        console.log("chartData : " + chartData);
        console.log("backendArray : " + backendArray);

             
    };
    // END STOPWATCH FUNCTION


    // CHART FUNCTION
    function updateChart () {
        var chart = $("#chartView");
        var myDoughnutChart = new Chart(chart, {
            type: 'doughnut',
            
            data: {
                // DISPLAY activityName as label on chart
                labels: chartLabels,
                datasets: [
                    {   
                        label: "Duration of Activities",
                        backgroundColor: ["#FF6384","#FFCD56","#36A2EB","#4BC0C0","#33A02C","#FB9C9B","#E31A1C","#FDBF6F","#CAB2D6","#6A3D9A","#FFFF99"],
                        data: chartData,
                    }
                ]
            },
            options: {
                animation: {
                    animateScale: true
                },
                tooltips: {
                    callbacks: {
                        enabled: true,
                        mode: 'single',
                        title: function(tooltipItems, data) {
                            return data["labels"][tooltipItems[0]["index"]];
                        },
                        label: function(tooltipItems, data) {

                            // parses out time readings in the legible format "hh hours mm minutes ss seconds"
                            if ((data["datasets"][0]["data"][tooltipItems["index"]]) < 60000 ) {
                                return ( Math.round( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 ) ) + " seconds";
                            } else if ( 3600000 > (data["datasets"][0]["data"][tooltipItems["index"]]) > 60000) {
                                var m = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) / 60000 );
                                return ( Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60) ) + " minutes "
                                    + ( Math.round( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - ( 60000 * m ) )/1000 ) ) + " seconds";
                            } else if ((data["datasets"][0]["data"][tooltipItems["index"]]) > 3600000) {
                                var h = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60 / 60 );
                                m = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) / 60000 );
                                return ( Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60 / 60) ) + " hours "
                                    + ( Math.floor( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - (3600000 * h) )/1000 / 60) ) + " minutes "
                                    + ( Math.round( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - ( 60000 * m ) )/1000 ) ) + " seconds";
                            };
                        }
                    }
                },
                title: {
                    display: true, 
                    fontColor: "rgb(208, 212, 212)",
                    text: "Today's time allocations"
                },
            }
        });
    };
    // END CHART FUNCTION

    
});








// FUNCTIONALITY

    // Capture name of activity and assign to variable "activityName"
    // At time of "stop" click capture time
    // Assign time to a variable "currentTime"
    // Display activityName and currentTime in table row


// Activity selector: can this be a dropdown? with the option to manually enter something?
// For chart, it will be important to have strings match


// Psuedocode:
// PROGRAM productivityTimer
    // READ currentTime
    // READ accumulatedTime
    // READ activityName

    // MODULE trackTime
        // ^ on click of "start time" button
            // ^ HIDE "start time" button and input form
            // ^ SHOW timer and "stop timer" button
            // ^ ASSIGN var currentTime = present time at time of button click and activityName = string in the input form at time of click
            // START timer
            // ^ DISPLAY activityName as string in column 1 of the table
            // ^ DISPLAY activityName as label on chart
            // ^ DISPLAY currentTime as string in column 3 of the table
                // other columns can have placeholder of "--"
    // END MODULE

    // MODULE logTime
        // ^ on click of "stop" button
            // ^ HIDE "stop" button and timer
            // ^ SHOW "start time" button and input form
            // ASSIGN var accumulatedTime = time shown on timer at time of button click
            // ^ ASSIGN var currentTime = present time at time of button click
            // DISPLAY accumulatedTime as string in column 2 of table
            // ^ DISPLAY currentTime as string in column 4 of table
            // RUN module displayChart
    // END MODULE

    // MODULE displayChart
        // IF all of the table data values !== "--", then assign chart value to accumulatedTime
        // fit current values into chart so that they accumulate
            // more.......... 
    // END MODULE

// END PROGRAM