import { describe, expect, it } from "vitest";
import { getTestInstance } from "../../test-utils/test-instance";
import { haveIBeenPwned } from "./index";
describe("have-i-been-pwned", async () => {
	const { client } = await getTestInstance(
		{
			plugins: [haveIBeenPwned()],
		},
		{
			disableTestUser: true,
		},
	);

	it("should prevent account creation with compromised password", async () => {
		const uniqueEmail = `test-${Date.now()}@example.com`;
		const compromisedPassword = "123456789";

		const result = await client.signUp.email({
			email: uniqueEmail,
			password: compromisedPassword,
			name: "Test User",
		});
		expect(result.error).not.toBeNull();
		expect(result.error?.status).toBe(400);
		expect(result.error?.code).toBe(
			"THE_PASSWORD_YOU_ENTERED_HAS_BEEN_COMPROMISED_PLEASE_CHOOSE_A_DIFFERENT_PASSWORD",
		);
	});

	it("should allow account creation with strong, uncompromised password", async () => {
		const uniqueEmail = `test-${Date.now()}@example.com`;
		const strongPassword = `Str0ng!P@ssw0rd-${Date.now()}`;

		const result = await client.signUp.email({
			email: uniqueEmail,
			password: strongPassword,
			name: "Test User",
		});
		expect(result.data?.user).toBeDefined();
	});

	it("should prevent password update to compromised password", async () => {
		const uniqueEmail = `test-${Date.now()}@example.com`;
		const initialPassword = `Str0ng!P@ssw0rd-${Date.now()}`;

		const res = await client.signUp.email({
			email: uniqueEmail,
			password: initialPassword,
			name: "Test User",
		});
		const result = await client.changePassword(
			{
				currentPassword: initialPassword,
				newPassword: "123456789",
			},
			{
				headers: {
					authorization: `Bearer ${res.data?.token}`,
				},
			},
		);
		expect(result.error).toBeDefined();
		expect(result.error?.status).toBe(400);
	});
});
