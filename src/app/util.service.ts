import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UtilService {

    private telemetrySocket: any; // socket object for telemetry service

    public liveFlights: Array<any> = []; // list of live flights

    private authToken = ''; // auth token from login response

    constructor(private http: HttpClient) {
        this.telemetrySocket = null;
    }

    /**
     * 
     * @param username string
     * @param password string
     * 
     * Takes in username and password and makes a POST call to https://labs.asteria.co.in/auth/login with username and password in the body.
     * We save the authToken from the response for future requests
     */
    public login(username: string, password: string) {
        const payload = {
            username,
            password
        };
        return this.http.post<any>('https://labs.asteria.co.in/auth/login', payload)
            .pipe(tap(({ data }) => this.authToken = data.authToken))
            .toPromise();
    }

    /**
     * Gets all the live flights at the moment. Makes a GET call to https://labs.asteria.co.in/api/v1.0/flight/query?auth_token=authToken&live=true where
     * authToken is the token from the login call. The API returns a list of live flights. We are also saving the flights to an array called liveFlights.
     */
    public getLiveFlights() {
        return this.http.get<any>(`https://labs.asteria.co.in/api/v1.0/flight/query?auth_token=${this.authToken}&live=true`)
            .pipe(tap(({ data }) => this.liveFlights = data))
            .toPromise();
    }

    /**
     * 
     * @param flightId id of the flight we want to connect to. When connected, we can issue flight commands to this flight
     * This function does the following
     * 1. Create a web socket connection to wss://labs.asteria.co.in/telemetry. This establishes a socket connection with this client and telemetry service
     * 2. When the connection is established, it sends auth_token, flight_id and localIPAddress as payload for a handshake. auth_token is the token from login request,
     *    flight_id is the id of the flight we want to connect to. Could be any one of the flights from the liveFlights arary, localIPAddress can be ignored.
     * 3. Once the handshake is complete, we will get a "success" message from telemetry service. This means that this client is ready to issue flight commands
     */
    public connectToTelemetryService(flightId: string) {
        // Establish connection
        this.telemetrySocket = new WebSocket('wss://labs.asteria.co.in/telemetry');
        this.telemetrySocket.onopen = () => {
            this.telemetrySocket.send(JSON.stringify({
                flight_id: flightId,
                auth_token: this.authToken,
                localIPAddress: "0cce6b88-83d0-4442-8d7d-8c1cc91a6f25.local"
            }));
        }
        // If you want to listen to the messages from telemetry service, it can be done with the below line
        this.telemetrySocket.onmessage = (data: any) => {
            // console.log('message from telemetry', data);
        };
    }

    /**
     * 
     * @param command value can be ADDLOOKHERE or ADDLOITERHERE
     * @param flightId id of the flight which we want to issue commands to.
     * @param latitude latitude value in number format. E.g 13.07595
     * @param longitude longitude value in number format. E.g 77.76085
     * @param altitude altitude value in number format. E.g 100
     * This function takes the above parameters and sends a message through to the socket connection to telemetry service which would relay it to MCS.
     */
    public addLoiterLookCommands(command: 'ADDLOOKHERE' | 'ADDLOITERHERE', flightId: string, latitude: number, longitude: number, altitude: number) {
        this.telemetrySocket?.send(JSON.stringify({
            command: command,
            flight_id: flightId,
            value: {
                latitude: latitude,
                longitude: longitude,
                altitude: altitude
            }
        }));
    }

    /**
     * 
     * @param command value can be REMOVELOOKHERE or REMOVELOITERHERE
     * @param flightId id of the flight which we want to issue commands to.
     */
    public removeLoiterLookCommands(command: 'REMOVELOOKHERE' | 'REMOVELOITERHERE', flightId: string) {
        this.telemetrySocket?.send(JSON.stringify({
            command: command,
            flight_id: flightId
        }));
    }
}
