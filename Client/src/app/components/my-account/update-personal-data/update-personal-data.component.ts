import { Component, OnInit } from '@angular/core';
import { FormBase } from '../../../source/form-base';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserMyAccountService } from '../../../services/business/user-my-account.service';
import { UpdatePersonalDataRequest } from '../../../source/models/dtos/users/personal-data/update-personal-data-request';
import { UserResponse } from '../../../source/models/business/user-response';
import { Utils } from '../../../source/utils';
declare let alertify: any;

@Component({
    selector: 'app-update-personal-data',
    templateUrl: './update-personal-data.component.html',
    styleUrl: './update-personal-data.component.css'
})
export class UpdatePersonalDataComponent extends FormBase implements OnInit {
    
    _user: UserResponse|null = null;
    
    constructor(
        private activatedRoute: ActivatedRoute,
        private formBuilder: FormBuilder,
		private router: Router,		
		private UserMyAccountService: UserMyAccountService,
    ) {
        super(); 				
    }

    async ngOnInit() {        
        await this.getDataAsync();
        await this.setupFormAsync();
    }

    async getDataAsync() {
		this._error = null;
        this._isLoading = true;
        await this.UserMyAccountService
            .getPersonalDataAsync()
            .then(p => {
				this._user = p;
                this._isLoading = false;
			})
			.catch(e => {
                this._error = Utils.getErrorsResponse(e);	
				this._isLoading = false;
			});
    }

    override setupFormAsync(): void {
		if (this._user === null) {
			return;
		}

		this._myForm = this.formBuilder.group({
			firstName: [this._user.firstName, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
			lastName: [this._user.lastName, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
			phoneNumber: [this._user.phoneNumber, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
		});
    }

    onDoneClicked() {
		this._error = null!;
		if (!this.isFormValid()) {
			return;
		}
		
		this._isProcessing = true;

        let model = new UpdatePersonalDataRequest(
			this._myForm?.controls['firstName'].value, 
			this._myForm?.controls['lastName'].value, 
			this._myForm?.controls['phoneNumber'].value,
        );

        this.UserMyAccountService.updatePersonalData(model)
			.subscribe({
				complete: () => {
					this._isProcessing = false;
				},
				error: (e : string) => {
					this._isProcessing = false;
					this._error = Utils.getErrorsResponse(e);;
				},
				next: (val) => {
					this.router.navigateByUrl('/my-account');
					alertify.message("Cambios guardados", 1)
				}
			});
	}
}
