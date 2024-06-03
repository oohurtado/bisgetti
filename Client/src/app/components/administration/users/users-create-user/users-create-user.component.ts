import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserAdministrationService } from '../../../../services/business/user/user-administration.service';
import { LocalStorageService } from '../../../../services/common/local-storage.service';
import { UserValidatorService } from '../../../../services/validators/user-validator.service';
import { ListFactory } from '../../../../source/factories/list-factory';
import { FormBase } from '../../../../source/form-base';
import { Tuple2 } from '../../../../source/models/common/tuple';
import { UserCreateUserRequest } from '../../../../source/models/dtos/user/administration/user-create-user-request';
import { EnumRole } from '../../../../source/models/enums/role.enum';
import { RoleStrPipe } from '../../../../pipes/role-str.pipe';

@Component({
    selector: 'app-users-create-user',
    templateUrl: './users-create-user.component.html',
    styleUrl: './users-create-user.component.css'
})
export class UsersCreateUserComponent extends FormBase implements OnInit {
    
    _userRoles: Tuple2<string,string>[] = [];

	constructor(
		private formBuilder: FormBuilder,
		private router: Router,		
		private userAdministrationService: UserAdministrationService,
		private userValidator: UserValidatorService,
	) {
		super();
	}

	async ngOnInit() {
        this.setLists();
		await this.setupFormAsync();
	}

    setLists() {
        let pipe = new RoleStrPipe();
        this._userRoles.push(new Tuple2(EnumRole.UserAdmin, pipe.transform(EnumRole.UserAdmin)));
        this._userRoles.push(new Tuple2(EnumRole.UserBoss, pipe.transform(EnumRole.UserBoss)));
        this._userRoles.push(new Tuple2(EnumRole.UserCustomer, pipe.transform(EnumRole.UserCustomer)));
    }

	override async setupFormAsync() {
		await this.setupForm();
	}

	setupForm() {
		this._myForm = this.formBuilder.group({
			firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
			lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
			phoneNumber: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
			email: ['', [Validators.required, Validators.email, Validators.minLength(1), Validators.maxLength(100)], [this.userValidator.isEmailAvailable.bind(this.userValidator)]],
			password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            userRole: [null, [Validators.required]]
		});
	}

    onDoneClicked() {
		this._error = null!;
		if (!this.isFormValid()) {
			return;
		}
		
		this._isProcessing = true;

        let model = new UserCreateUserRequest(
			this._myForm?.controls['firstName'].value, 
			this._myForm?.controls['lastName'].value, 
			this._myForm?.controls['phoneNumber'].value,
			this._myForm?.controls['email'].value,
			this._myForm?.controls['password'].value,
            this._myForm?.controls['userRole'].value
        );

        this.userAdministrationService.createUser(model)
			.subscribe({
				complete: () => {
					this._isProcessing = false;
				},
				error: (errorResponse : string) => {
					this._isProcessing = false;
					this._error = errorResponse;
				},
				next: (val) => {
					this.router.navigateByUrl('/administration/users');
				}
			});
	}
}
