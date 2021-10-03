import { Players } from "@rbxts/services";

/**
 * Retrieves the Player owner of a BasePart within their character, if one exists.
 *
 * @param part The potential Player's Character part to be checked
 * @returns The player the part belongs to, OR undefined if no player was found.
 */
function GetPlayerFromPart(part: BasePart): Player | undefined {
	const humanoid = part.Parent?.FindFirstChild("Humanoid");
	if (humanoid) {
		const name = humanoid.Parent!.Name;
		const player = <Player | undefined>Players.FindFirstChild(name);
		return player;
	} else {
		return undefined;
	}
}

function ComputeRowEchelonForm(matrix: Array<Array<number>>) {
	let lead = 0;
	const rowCount = matrix.size();
	const columnCount = matrix[0].size();

	for (let r = 0; r < rowCount; r++) {
		if (columnCount <= lead) {
			return;
		}
		let i = r;
		while (matrix[i][lead] === 0) {
			i = i + 1;
			if (rowCount === i) {
				i = r;
				lead = lead + 1;
				if (columnCount === lead) {
					return;
				}
			}
		}

		// Swap rows i and r
		const swapRow = matrix[i];
		matrix[i] = matrix[r];
		matrix[r] = swapRow;

		if (matrix[r][lead] !== 0) {
			// divide row r by M[r, lead]
			const divisor = matrix[r][lead];
			for (let c = 0; c < columnCount; c++) {
				matrix[r][c] /= divisor;
			}
		}
		for (i = 0; i < rowCount; i++) {
			if (i !== r) {
				// Subtract M[i, lead] multiplied by row r from row i
				for (let c = 0; c < columnCount; c++) {
					matrix[i][c] -= matrix[i][lead] * matrix[r][c];
				}
			}
		}
		lead = lead + 1;
	}
}

export { GetPlayerFromPart, ComputeRowEchelonForm };
