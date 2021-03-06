import Make from "./Make.js";
const STUB_PATH = `${Felony.felonyPath}/stubs/Middleware.stub`;

/**
 * Generator command
 *
 * @class
 */
export default class MakeMiddlewareCommand extends Make {
  /**
   * Integrated command flag
   *
   * @type boolean
   */
  static integrated = true;

  /**
   * Static signature key that will be callable name of our command.
   *
   * @type string
   */
  static signature = "make:middleware";

  /**
   * User friendly description of the command that has to be static.
   *
   * @type string
   */
  static description = "Create new middleware";

  /**
   * Example of the command usage.
   *
   * @type string
   */
  static usage = "command=make:middleware name=ExampleMiddleware.js";

  /**
   * Handler method of the command that will run the action.
   *
   * @return {Promise<void>}
   */
  async handle() {
    if (
      typeof this.payload.name !== "string"
      || !this.payload.name.endsWith(".js")
    ) {
      throw new Error("MakeMiddlewareCommand: Invalid middleware name provided");
    }

    const replacements = {
      MIDDLEWARE_NAME: this.payload.name.split("/").pop().replace(".js", ""),
    };

    const content = await this.createFile(STUB_PATH, replacements);
    await this.storeFile(`middleware/${this.payload.name}`, content);

    console.log(
      `Middleware ${replacements.MIDDLEWARE_NAME} created successfully`,
    );
  }
}
