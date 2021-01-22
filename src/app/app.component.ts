import { Component, OnInit } from '@angular/core';
import { UtilService } from './util.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'genesis-third-party-flight-commands';

    constructor(private utilService: UtilService) { }

    public async ngOnInit() {
        await this.start();
    }

    /**
     * This function orchestrates the 4 steps needed to issue flight commands to UAV.
     * 1. Login and get auth token
     * 2. Get a list of live flights
     * 3. Connect to telemetry service
     * 4. Issue Loiter and Look commands
     * 
     * The util.service.ts file contains utility functions which make the API calls. Please refer to util.service.ts file for function definitions
     */
    private async start() {
        // Call login endpoint with provided username and password
        await this.utilService.login('username', 'password');

        // Get a list of live flights
        await this.utilService.getLiveFlights();

        /** There maybe more than one live flight at any given time. So, live flights will be an array. I'm connecting only the first flight here as an example.
         * We can connect to multiple flights in the same way.
        */
        if (this.utilService.liveFlights.length > 0) { // If there is a live flight
            const flight = this.utilService.liveFlights[0];

            // Connect to telemetry service. This establishes a socket connection with telemetry service
            this.utilService.connectToTelemetryService(flight.flightId);

            // Issue loiter/look command 
            this.utilService.addLoiterLookCommands('ADDLOOKHERE', flight.id, 13.07595, 77.76085, 100.007);
        }
    }
}
